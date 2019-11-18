import Menu from './Menu';
import React, { useEffect, useState } from 'react';
import { Ellipse, Lasso, Rectangle, ShapeProps } from './Shape';
import { Filter, TableauError, Worksheet } from '@tableau/extensions-api-types';
import { Spinner } from '@tableau/tableau-ui';
import './Home.css';

export const modes = {
	EDIT: {
		ELLIPSE: 'ellipse',
		LASSO: 'lasso',
		RECTANGLE: 'rectangle',
	},
	SELECT: 'select',
	MOVE: 'move',
	TESTING: 'testing',
	VIEWING: 'viewing',
};

export type ShapeGenerator = (props: ShapeProps) => JSX.Element;

const shapeTypes: { [index: string]: ShapeGenerator } = {
	ellipse: Ellipse,
	lasso: Lasso,
	rectangle: Rectangle,
};

export interface Item {
	name: string;
	selected: boolean;
}

export interface Image {
	name: string;
	ext: string;
	data: string;
}

interface ShapeFilter {
	name: string;
	values: string[];
}

export interface Shape {
	id: string;
	type: string;
	coords: number[];
	points: number[][];
	originalPoints: number[][];
	dimensions?: number[];
	radius?: number[];
	active?: boolean;
	values?: { field: string; value: string }[];
	onClick?: (event: React.MouseEvent<SVGElement, MouseEvent>) => void;
}

// Switches base URL based on where extension is being hosted
const baseURL: string = window.location.origin.includes('localhost:3000') ? window.location.origin : '.';

function Home() {
	const [mode, setMode] = useState('viewing');
	const [configured, setConfigured] = useState<boolean>(true);
	const [shapes, setShapes] = useState<Array<Shape>>([]);
	const [currentShape, setCurrentShape] = useState<Shape | null>();
	const [startMove, setStartMove] = useState<[string, number, number] | null>();
	const [loading, setLoading] = useState<boolean>(true);
	const [filters, setFilters] = useState<Array<ShapeFilter>>([]);
	const [scaling, setScaling] = useState<number>(0);
	const [image, setImage] = useState<Image>();
	// const [imageDimensions, setImageDimensions] = useState<Array<number>>();

	useEffect(() => {
		tableau.extensions.initializeAsync({ configure: configure }).then(() => {
			const settings = tableau.extensions.settings.getAll();
			if (tableau.extensions.environment.mode === 'authoring') {
				setMode(modes.EDIT.LASSO);
			}
			if (settings.configured === 'true') {
				setConfigured(true);
				setImage({ ...JSON.parse(settings.image) });
				setScaling(parseInt(settings.scaling));
				if (settings.shapes) {
					loadShapes(JSON.parse(settings.shapes));
				}
				setLoading(false);
				testSettings();
			} else {
				setConfigured(false);
				setLoading(false);
				configure();
			}
		});
		// eslint-disable-next-line
	}, []);

	const configure = () => {
		tableau.extensions.ui.displayDialogAsync(`${baseURL}/config.html`, '', { width: 650, height: 550, }).then(() => {
			const settings = tableau.extensions.settings.getAll();
			setConfigured(true);
			setImage({ ...JSON.parse(settings.image) });
			setScaling(parseInt(settings.scaling));

			window.dispatchEvent(new Event('resize'));
			// TODO
			// Shorter than below
			// and works but need to test if this workds in IE11
			// let resizeEvent = window.document.createEvent('UIEvents');
			// resizeEvent.initUIEvent('resize', true, false, window, 0);
			// window.dispatchEvent(resizeEvent);
		}).catch((error: TableauError) => {
			switch (error.errorCode) {
				case tableau.ErrorCodes.DialogClosedByUser:
					console.log('Dialog was closed by user.');
					break;
				default:
					console.error(error.message);
			}
		});
		return {};
	};

	// Helper function to change mode
	const changeMode = (newMode: string) => {
		setCurrentShape(null);
		if (
			[modes.TESTING, modes.VIEWING].includes(newMode) ||
			[modes.TESTING, modes.VIEWING].includes(mode)
		) {
			clearFilters();
		}
		setMode(newMode);
	};

	// Gets shapes from settings
	const loadShapes = (shapeSettings: Shape[]) => {
		for (const shape of shapeSettings) {
			setShapes((shapes) => [...shapes, { ...shape, active: false }]);
		}
	};

	// Displays svgs for shape data
	const ShapeDisplay = (shape: Shape) => {
		const MatchingShape = shapeTypes[shape.type];
		return (
			<MatchingShape {...shape} key={shape.id} mode={mode} title={shape.values ? shape.values.map((v: { field: string; value: string }) => v.field).join() : ''} />
		);
	};

	// Tests that selected dimensions and worksheets still exist
	const testSettings = () => {
		const settings = tableau.extensions.settings.getAll();
		const dimensions = JSON.parse(settings.dimensions);
		const worksheets = JSON.parse(settings.worksheets);
		const dashboard = tableau.extensions.dashboardContent.dashboard;
		const foundWorksheets: string[] = [];
		const foundDimensions: string[] = [];
		const promises = [];
		for (const sheetName of worksheets) {
			const worksheet = dashboard.worksheets.find((ws: Worksheet) => ws.name === sheetName);
			if (worksheet) {
				if (foundWorksheets.includes(sheetName) === false) foundWorksheets.push(sheetName);
				promises.push(worksheet.getFiltersAsync().then((filters: Filter[]) => {
					for (const filter of filters) {
						if (foundDimensions.includes(filter.fieldName) === false) foundDimensions.push(filter.fieldName);
					}
				}))
			}
		}
		Promise.all(promises).then(() => {
			if (!dimensions.every((d: string) => foundDimensions.includes(d)) || !worksheets.every((w: string) => foundWorksheets.includes(w))) {
				setConfigured(false);
			}
		}).catch((err: Error) => {
			console.log('Error while validating: ' + err.toString());
		});
	}

	// Creates a new shape when mousedown on canvase
	const handleCanvasDown = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.button === 0) {
			if (!currentShape) {
				// Create new shape
				const id = new Date().getTime().toString();
				setCurrentShape({
					id,
					type: mode,
					coords: [e.pageX, e.pageY],
					points: [[e.pageX, e.pageY]],
					dimensions: [0, 0],
					radius: [0, 0],
					originalPoints: [],
				});
			}
		}
	};

	// Updates shape parameters while mouse is down and moving
	const handleCanvasDrag = (e: React.MouseEvent<HTMLDivElement>) => {
		if (currentShape) {
			const originalX = currentShape.points[0][0];
			const originalY = currentShape.points[0][1];
			const mouseX = e.pageX;
			const mouseY = e.pageY;
			let newShape;
			switch (mode) {
				case 'ellipse':
					let radiusX = Math.abs(originalX - mouseX);
					let radiusY = Math.abs(originalY - mouseY);
					if (e.shiftKey) {
						radiusX = Math.max(radiusX, radiusY);
						radiusY = Math.max(radiusX, radiusY);
					}
					newShape = { ...currentShape, radius: [radiusX, radiusY] };
					break;
				case 'rectangle':
					let width = mouseX - originalX;
					let height = mouseY - originalY;
					if (e.shiftKey) {
						width = Math.sign(width) * Math.max(Math.abs(width), Math.abs(height));
						height = Math.sign(height) * Math.max(Math.abs(width), Math.abs(height));
					}
					newShape = {
						...currentShape,
						coords: [
							originalX + Math.min(width, 0),
							originalY + Math.min(height, 0),
						],
						dimensions: [Math.abs(width), Math.abs(height)],
					};
					break;
				case 'lasso':
					newShape = {
						...currentShape,
						points: [...currentShape.points, [mouseX, mouseY]],
						originalPoints: [...currentShape.points, [mouseX, mouseY]],
					};
					break;
			}
			setCurrentShape(newShape);
		}
	};

	// Finishes shape on mouseup, opens shape config
	const handleCanvasUp = (e: React.MouseEvent<HTMLDivElement>) => {
		// Finish shape
		if (currentShape) {
			const settings = tableau.extensions.settings.getAll();
			const height = (JSON.parse(settings.dimensions).length - 1) * 50;
			tableau.extensions.ui.displayDialogAsync(`${baseURL}/shape.html`, 'null', { width: 300, height: 140 + height, }).then((closePayload: string) => {
				if (closePayload === 'delete') {
					setCurrentShape(null);
				} else {
					const newShape = {
						...currentShape,
						values: JSON.parse(closePayload),
					};
					const newShapes = [...shapes, newShape];
					setShapes(newShapes);
					setCurrentShape(null);
					tableau.extensions.settings.set(
						'shapes',
						JSON.stringify(newShapes)
					);
					tableau.extensions.settings.saveAsync();
				}
			}).catch((error: TableauError) => {
				if (
					error.errorCode === tableau.ErrorCodes.DialogClosedByUser
				) {
					setCurrentShape(null);
					console.log('Dialog was closed by user, shape deleted.');
				} else {
					console.error(error.message);
				}
			});
		}
	};

	// Based on mode, manipulates shape on mousedown
	const handleShapeDown = (e: React.MouseEvent<SVGElement>) => {
		const target = e.target as SVGElement;
		if (target.id !== 'svgRoot') {
			const shape = shapes.find((shape) => shape.id === target.id);
			if (shape) {
				if (mode === 'move') {
					setStartMove([target.id, e.pageX, e.pageY]);
				} else if (mode === 'select') {
					editShape(shape.id, shape.values);
				} else {
					updateFilters(shape.id, shape.values, e.shiftKey || e.ctrlKey);
				}
			}
		} else {
			handleClearFilters(e);
		}
	};

	// If in move mode, moves shape while mouse is down and moving
	const handleShapeDrag = (e: React.MouseEvent<SVGElement>) => {
		if (mode === 'move' && startMove) {
			console.log(startMove)
			const oldShape = shapes.find((shape) => shape.id === startMove[0]) as Shape;
			if (oldShape) {
				let newShape: Shape;
				const mouseStartX = startMove[1];
				const mouseStartY = startMove[2];
				const mouseX = e.pageX;
				const mouseY = e.pageY;
				const width = mouseX - mouseStartX;
				const height = mouseY - mouseStartY;
				const originalX = oldShape.points[0][0];
				const originalY = oldShape.points[0][1];
				switch (oldShape.type) {
					case 'ellipse':
						newShape = {
							...oldShape,
							coords: [originalX + width, originalY + height],
						};
						break;
					case 'rectangle':
						newShape = {
							...oldShape,
							coords: [originalX + width, originalY + height],
						};
						break;
					case 'lasso':
						let points = oldShape.originalPoints;
						points = points.map((point) => {
							return [point[0] + width, point[1] + height];
						});
						newShape = { ...oldShape, points: points };
						break;
					default:
						newShape = { ...oldShape };
						break;
				}
				let newShapes = [...shapes];
				newShapes = newShapes.map((shape) => {
					if (shape.id === oldShape.id) {
						return newShape;
					} else {
						return shape;
					}
				});
				setShapes(newShapes);
			}
		}
	};

	// When in move mode, saves new shape's position
	const handleShapeUp = (e: React.MouseEvent<SVGElement>) => {
		if (mode === 'move' && startMove) {
			const oldShape = shapes.find((shape) => shape.id === startMove[0]) as Shape;
			if (oldShape) {
				let newShape: Shape;
				switch (oldShape.type) {
					case 'ellipse':
						newShape = {
							...oldShape,
							points: [[oldShape.coords[0], oldShape.coords[1]]],
						};
						break;
					case 'rectangle':
						newShape = {
							...oldShape,
							points: [[oldShape.coords[0], oldShape.coords[1]]],
						};
						break;
					case 'lasso':
						newShape = {
							...oldShape,
							points: oldShape.points,
							originalPoints: oldShape.points,
						};
						break;
					default:
						newShape = { ...oldShape };
						break;
				}
				let newShapes = [...shapes];
				newShapes = newShapes.map((shape) => {
					if (shape.id === oldShape.id) {
						return newShape;
					} else {
						return shape;
					}
				});
				setShapes(newShapes);
				setStartMove(null);
				tableau.extensions.settings.set('shapes', JSON.stringify(newShapes));
				tableau.extensions.settings.saveAsync();
			}
		}
	};

	// Edit settings for existing shape. Change filter value or delete
	const editShape = (id: string, values: { field: string; value: string }[]) => {

		// {field: "Sub-Category", value: "Accessories"}
		const settings = tableau.extensions.settings.getAll();
		const height = (JSON.parse(settings.dimensions).length - 1) * 50;
		tableau.extensions.ui.displayDialogAsync(`${baseURL}/shape.html`, JSON.stringify(values), { width: 300, height: 140 + height, }).then((closePayload: string) => {
			if (closePayload === 'delete') {
				let newShapes = [...shapes];
				newShapes = newShapes.filter((shape) => shape.id !== id);
				setShapes(newShapes);
				tableau.extensions.settings.set('shapes', JSON.stringify(newShapes));
				tableau.extensions.settings.saveAsync();
			} else {
				const newShapes = [...shapes];
				newShapes.map((shape) => {
					if (shape.id === id) {
						shape.values = JSON.parse(closePayload);
					}
					return shape;
				});
				setShapes(newShapes);
				tableau.extensions.settings.set('shapes', JSON.stringify(newShapes));
				tableau.extensions.settings.saveAsync();
			}
		}).catch((error: TableauError) => {
			console.error(error.message);
		});
	};

	// Controls worksheet filtering when shape selected
	const updateFilters = (id: string, values: { field: string; value: string }[], multiple: boolean) => {
		const shape = shapes.find((shape) => shape.id === id);
		if (shape) {
			const settings = tableau.extensions.settings.getAll();
			const dashboard = tableau.extensions.dashboardContent.dashboard;
			const selectedWorksheets = JSON.parse(settings.worksheets);
			let newFilters: ShapeFilter[] = [];
			if (multiple) {
				newFilters = [...filters];
			}

			for (const value of values) {
				if (multiple) {
					const filter = newFilters.find((filter) => filter.name === value.field);
					if (filter) {
						if (!shape.active) {
							filter.values.push(value.value);
						} else {
							filter.values = filter.values.filter((val) => val !== value.value);
						}
					} else {
						newFilters.push({ name: value.field, values: [value.value] });
					}
				} else {
					if (!shape.active) {
						newFilters.push({ name: value.field, values: [value.value] });
					} else if (
						shape.active &&
						shapes.filter((shape) => shape.active).length > 1
					) {
						newFilters.push({ name: value.field, values: [value.value] });
					}
				}
			}

			for (const worksheet of selectedWorksheets) {
				const ws = dashboard.worksheets.find((ws: Worksheet) => ws.name === worksheet);
				if (ws) {
					if (newFilters.length === 0) {
						for (const dimension of JSON.parse(settings.dimensions)) {
							ws.clearFilterAsync(dimension)
							// .catch(
							// 	console.log('Tried to clear filter, filter does not exist')
							// );
						}
					} else {
						for (const filter of newFilters) {
							const updatetype =
								filter.values[0] === '' || filter.values.length === 0
									? tableau.FilterUpdateType.All
									: tableau.FilterUpdateType.Replace;
							ws.applyFilterAsync(filter.name, filter.values, updatetype, { isExcludeMode: false })
							// .catch(
							// 	console.log('Tried to filter worksheet, could not filter')
							// );
						}
					}
				}
			}
			setFilters(newFilters);

			const newShapes = [...shapes];
			const currentActive = newShapes.filter((shape) => shape.active).length;
			newShapes.map((shape) => {
				if (shape.id === id) {
					if (
						(multiple && shape.active) ||
						(!multiple && shape.active && currentActive <= 1)
					) {
						shape.active = false;
					} else {
						shape.active = true;
					}
				} else {
					if (!multiple) {
						shape.active = false;
					}
				}
				return shape;
			});
			setShapes(newShapes);
		}
	};

	// Helper for clearing filters when select image
	const handleClearFilters = (e: React.MouseEvent<SVGElement>) => {
		if ((e.target as SVGElement).id === 'svgRoot') {
			clearFilters();
		}
	};

	// Removes all filters for selected dimensions on selected worksheets
	const clearFilters = () => {
		if (configured) {
			const dashboard = tableau.extensions.dashboardContent.dashboard;
			const settings = tableau.extensions.settings.getAll();
			const selectedWorksheets = JSON.parse(settings.worksheets);
			const selectedDimensions = JSON.parse(settings.dimensions);
			for (const worksheet of selectedWorksheets) {
				const ws = dashboard.worksheets.find((ws: Worksheet) => ws.name === worksheet);
				if (ws) {
					for (const dimension of selectedDimensions) {
						ws.clearFilterAsync(dimension)
						// .catch(
						// 	console.error('Tried to clear filter, filter does not exist')
						// );
					}
				}
			}
			setFilters([]);
			// Make sure nothing is marked as active
			const newShapes = [...shapes];
			newShapes.map((shape) => {
				shape.active = false;
				return shape;
			});
			setShapes(newShapes);
		} else {
			configure();
		}
	};

	// Add an event listener for window resizing to update scale of shapes
	useEffect(() => {
		if (tableau.extensions.settings) {
			const settings = tableau.extensions.settings.getAll();
			if (settings.imageDimensions) {
				window.addEventListener('resize', updateScale);
				return () => window.removeEventListener('resize', updateScale);
			}
		}
	});

	// Compares current scale to previously known scale to determine if shapes need updating
	const checkScale = () => {
		const settings = tableau.extensions.settings.getAll();
		const image = document.getElementById('mappedImg') as HTMLImageElement;

		if (settings.imageDimensions) {
			if (JSON.stringify(settings.imageDimensions) !== JSON.stringify([image.width, image.height])) {
				updateScale();
			}
		} else {
			tableau.extensions.settings.set('imageDimensions', JSON.stringify([image.width, image.height]));
			tableau.extensions.settings.saveAsync();
		}
	};

	// Changes scale of shapes based on new window
	const updateScale = () => {
		const settings = tableau.extensions.settings.getAll();
		const imageDimensions = JSON.parse(settings.imageDimensions);
		const image = document.getElementById('mappedImg') as HTMLImageElement;
		if (image && imageDimensions) {
			const newImageWidth = image.width;
			const newImageHeight = image.height;
			const oldImageWidth = imageDimensions[0];
			const oldImageHeight = imageDimensions[1];
			const scale = (coords: number[]) => {
				return [
					(coords[0] / oldImageWidth) * newImageWidth,
					(coords[1] / oldImageHeight) * newImageHeight
				]
			}

			if (
				newImageWidth !== oldImageWidth ||
				newImageHeight !== oldImageHeight
			) {
				let newShapes: Shape[] = [];
				for (const shape of shapes) {
					let newShape: Shape = shape;
					switch (shape.type) {
						case 'ellipse':
							if (shape.radius) {
								newShape = {
									...shape,
									coords: scale(shape.coords),
									points: [scale(shape.coords)],
									radius: scale(shape.radius),
								};
							}
							break;
						case 'rectangle':
							if (shape.dimensions) {
								newShape = {
									...shape,
									coords: scale(shape.coords),
									points: [scale(shape.coords)],
									dimensions: scale(shape.dimensions),
								};
							}
							break;
						case 'lasso':
							const oldShapePoints = shape.points;
							const newShapePoints = [];
							for (const point of oldShapePoints) {
								newShapePoints.push(scale(point));
							}
							newShape = {
								...shape,
								points: newShapePoints,
								originalPoints: newShapePoints,
							};
							break;
						default:
							newShape = { ...shape };
							break;
					}
					newShapes = [...newShapes, newShape];
				}

				setShapes(newShapes);
				tableau.extensions.settings.set('shapes', JSON.stringify(newShapes));
				tableau.extensions.settings.set('imageDimensions', JSON.stringify([newImageWidth, newImageHeight]));
				tableau.extensions.settings.saveAsync();
			}
		}
	};

	// setTimeout( checkScale, 5000);

	// Add event listener for keyboard shortcuts
	useEffect(() => {
		window.addEventListener('keydown', shortKeys);
		return () => window.removeEventListener('keydown', shortKeys);
	});

	// Keyboard shortcuts for three main editing modes
	const shortKeys = (e: KeyboardEvent) => {
		if (mode === 'ellipse' || mode === 'rectangle' || mode === 'lasso') {
			switch (e.keyCode) {
				// e
				case 69:
					changeMode('ellipse');
					break;
				// r
				case 82:
					changeMode('rectangle');
					break;
				// l
				case 76:
					changeMode('lasso');
					break;

				default:
					break;
			}
		}
	};

	return (
		<>
			<div className={`spinner${loading ? '' : ' hidden'}`}>
				<Spinner color="dark" />
			</div>

			<div className={`fullView noconfig${configured ? ' hidden' : ''}`}>Please configure extension</div>

			<svg id="svgRoot" className="fullView" onMouseDown={handleShapeDown} onMouseMove={handleShapeDrag} onMouseUp={handleShapeUp} onMouseLeave={handleShapeUp} >
				{shapes.map((shape) => (<ShapeDisplay {...shape} key={shape.id} onClick={handleShapeDown} />))}
				{currentShape ? (<ShapeDisplay {...currentShape} onClick={handleShapeDown} />) : ('')}
			</svg>

			<div id="selectionBox" onMouseDown={handleCanvasDown} onMouseUp={handleCanvasUp} onMouseMove={handleCanvasDrag} className={`selection fullView${Object.values(modes.EDIT).includes(mode) && configured ? '' : ' hidden'}`} />

			<div className={scaling === 0 ? ' fitDiv' : ''}>
				{/* onLoad={checkScale} */}
				<img id="mappedImg" onLoad={checkScale} src={image ? `data:image/png;base64, ${image.data}` : ''} className={`mappedImg${scaling === 0 ? ' fit' : ''}`} alt="" />
			</div>

			{configured && mode !== 'viewing' ? (<Menu setMode={changeMode} mode={mode} />) : ('')}
		</>
	);
}

export default Home;
