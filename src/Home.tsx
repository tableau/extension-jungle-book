import React, { useState, useEffect } from 'react';
import './Home.css';
import Menu from './Menu';
import { Ellipse, Lasso, Rectangle } from './Shape';
import { Spinner } from '@tableau/tableau-ui';
const tableau = window.tableau;

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
}

const shapeTypes: any = {
	'ellipse': Ellipse,
	'lasso': Lasso,
	'rectangle': Rectangle,
}

export interface Item {
	name: string;
	selected: boolean;
}

export interface Image {
	name: string;
	ext: string;
	data: string;
}

interface Filter {
	name: string;
	values: string[];
}

interface Shape {
	id: string;
	type: string;
	coords: number[];
	points: any[];
	originalPoints?: any[];
	dimensions?: any[];
	radius?: number[];
	active?: boolean;
	values: any[];
}

const baseURL: string = (window.location.origin.includes('localhost:3000')) ? window.location.origin : '.';

function Home() {

	const [mode, setMode] = useState('viewing');
	const [configured, setConfigured] = useState<boolean>(true);
	const [shapes, setShapes] = useState<Array<any>>([]);
	const [currentShape, setCurrentShape] = useState<any>();
	const [startMove, setStartMove] = useState<Array<any>>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [filters, setFilters] = useState<Array<Filter>>([]);
	const [scaling, setScaling] = useState<number>(0);
	const [image, setImage] = useState<Image>();
	const [imageDimensions, setImageDimensions] = useState<Array<number>>();

	useEffect(() => {
		tableau.extensions.initializeAsync({ 'configure': configure }).then(() => {
			const settings = tableau.extensions.settings.getAll();
			if (tableau.extensions.environment.mode === 'authoring') {
				setMode('lasso')
			}
			if (settings.configured === 'true') {
				setConfigured(true);
				setImage({ ...JSON.parse(settings.image) });
				setImageDimensions(JSON.parse(settings.imageDimensions));
				setScaling(parseInt(settings.scaling));
				if (settings.shapes) {
					loadShapes(JSON.parse(settings.shapes));
				}
				setLoading(false);
			} else {
				setConfigured(false);
				setLoading(false);
				configure();
			}
		});
		// eslint-disable-next-line
	}, []);

	const configure = () => {
		tableau.extensions.ui.displayDialogAsync(`${baseURL}/config.html`, '', { width: 650, height: 525 }).then(() => {
			const settings = tableau.extensions.settings.getAll();
			setConfigured(true);
			setImage({ ...JSON.parse(settings.image) });
			setScaling(parseInt(settings.scaling));
			if (mode === 'viewing') {
				setMode('lasso');
			}
			// window.dispatchEvent(new Event('resize'));
			let resizeEvent = window.document.createEvent('UIEvents');
			resizeEvent.initUIEvent('resize', true, false, window, 0);
			window.dispatchEvent(resizeEvent);
		}).catch((error: any) => {
			switch (error.errorCode) {
				case tableau.ErrorCodes.DialogClosedByUser:
					console.log('Dialog was closed by user.');
					break;
				default:
					console.error(error.message);
			}
		});
	}

	const changeMode = (newMode: string) => {
		setCurrentShape(null);
		if (newMode === 'testing' || newMode === 'viewing' || mode === 'testing' || mode === 'viewing') { clearFilters() }
		setMode(newMode);
	}

	const loadShapes = (shapeSettings: any) => {
		for (let shape of shapeSettings) {
			setShapes(shapes => [...shapes, { ...shape, active: false }]);
		}
	}

	const ShapeDisplay = (shape: any) => {
		const MatchingShape = shapeTypes[shape.type];
		return <MatchingShape {...shape} key={shape.id} mode={mode} />
	}

	const handleCanvasDown = (e: any) => {
		if (e.button === 0) {
			if (!currentShape) {
				// Create new shape
				const id = new Date().getTime().toString();
				setCurrentShape({ id, type: mode, coords: [e.pageX, e.pageY], points: [[e.pageX, e.pageY]], dimensions: [0, 0], radius: [0, 0] });
			}
		}
	};

	const handleCanvasDrag = (e: any) => {
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
					newShape = { ...currentShape, coords: [parseInt(originalX) + Math.min(width, 0), parseInt(originalY) + Math.min(height, 0)], dimensions: [Math.abs(width), Math.abs(height)] };
					break;
				case 'lasso':
					newShape = { ...currentShape, points: [...currentShape.points, [mouseX, mouseY]], originalPoints: [...currentShape.points, [mouseX, mouseY]] };
					break;
			}
			setCurrentShape(newShape);
		}
	}

	const handleCanvasUp = (e: any) => {
		// Finish shape
		if (currentShape) {
			const settings = tableau.extensions.settings.getAll();
			const height = (JSON.parse(settings.dimensions).length - 1) * 50;
			tableau.extensions.ui.displayDialogAsync(`${baseURL}/shape.html`, '', { width: 300, height: 140 + height }).then((closePayload: string) => {
				if (closePayload === 'delete') {
					setCurrentShape(null);
				} else {
					const newShape = { ...currentShape, values: JSON.parse(closePayload) };
					const newShapes = [...shapes, newShape];
					setShapes(newShapes);
					setCurrentShape(null);
					tableau.extensions.settings.set('shapes', JSON.stringify(newShapes));
					tableau.extensions.settings.saveAsync();
				}
			}).catch((error: any) => {
				if (error.errorCode === window.tableau.ErrorCodes.DialogClosedByUser) {
					console.log('Dialog was closed by user, shape deleted.');
					setCurrentShape(null);
				} else {
					console.error(error.message);
				}
			});
		}
	}

	const handleShapeDown = (e: any) => {
		if (e.target.id !== 'svgRoot') {
			let shape = shapes.find(shape => shape.id === e.target.id);
			if (mode === 'move') {
				setStartMove([e.target.id, e.pageX, e.pageY]);
			} else if (mode === 'select') {
				editShape(shape.id, shape.values);
			} else {
				updateFilters(shape.id, shape.values, e.shiftKey || e.ctrlKey);
			}
		} else {
			handleClearFilters(e);
		}
	}

	const handleShapeDrag = (e: any) => {
		if (mode === 'move' && startMove.length !== 0) {
			let oldShape = shapes.find(shape => shape.id === startMove[0]);
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
					newShape = { ...oldShape, coords: [originalX + width, originalY + height] };
					break;
				case 'rectangle':
					newShape = { ...oldShape, coords: [originalX + width, originalY + height] };
					break;
				case 'lasso':
					let points: any[] = oldShape.originalPoints;
					points = points.map(point => {
						return [point[0] + width, point[1] + height];
					});
					newShape = { ...oldShape, points: points };
					break;
				default:
					newShape = { ...oldShape };
					break;
			}
			let newShapes = [...shapes];
			newShapes = newShapes.map(shape => {
				if (shape.id === oldShape.id) {
					return newShape;
				} else {
					return shape;
				}
			})
			setShapes(newShapes);
		}
	}

	const handleShapeUp = (e: any) => {
		if (mode === 'move' && startMove.length !== 0) {
			let oldShape = shapes.find(shape => shape.id === startMove[0]);
			let newShape: Shape;
			switch (oldShape.type) {
				case 'ellipse':
					newShape = { ...oldShape, points: [[oldShape.coords[0], oldShape.coords[1]]] };
					break;
				case 'rectangle':
					newShape = { ...oldShape, points: [[oldShape.coords[0], oldShape.coords[1]]] };
					break;
				case 'lasso':
					newShape = { ...oldShape, points: oldShape.points, originalPoints: oldShape.points };
					break;
				default:
					newShape = { ...oldShape };
					break;
			}
			let newShapes = [...shapes];
			newShapes = newShapes.map(shape => {
				if (shape.id === oldShape.id) {
					return newShape;
				} else {
					return shape;
				}
			})
			setShapes(newShapes);
			setStartMove([]);
			tableau.extensions.settings.set('shapes', JSON.stringify(newShapes));
			tableau.extensions.settings.saveAsync();
		}
	}

	const editShape = (id: string, values: any) => {
		const settings = tableau.extensions.settings.getAll();
		const height = (JSON.parse(settings.dimensions).length - 1) * 50;
		tableau.extensions.ui.displayDialogAsync(`${baseURL}/shape.html`, '', { width: 300, height: 140 + height }).then((closePayload: string) => {
			if (closePayload === 'delete') {
				let newShapes = [...shapes];
				newShapes = newShapes.filter(shape => shape.id !== id);
				setShapes(newShapes);
				tableau.extensions.settings.set('shapes', JSON.stringify(newShapes));
				tableau.extensions.settings.saveAsync();
			} else {
				let newShapes = [...shapes];
				newShapes.map(shape => {
					if (shape.id === id) {
						shape.values = JSON.parse(closePayload);
					}
					return shape;
				})
				setShapes(newShapes);
				tableau.extensions.settings.set('shapes', JSON.stringify(newShapes));
				tableau.extensions.settings.saveAsync();
			}
		}).catch((error: any) => {
			console.error(error.message);
		});
	}

	const updateFilters = (id: string, values: any, multiple: boolean) => {
		const settings = tableau.extensions.settings.getAll();
		const dashboard = tableau.extensions.dashboardContent.dashboard;
		const selectedWorksheets = JSON.parse(settings.worksheets)
		let newFilters: Filter[] = [];
		if (multiple) {
			newFilters = [...filters];
		}

		for (let value of values) {
			if (multiple) {
				let filter = newFilters.find(filter => filter.name === value.field);
				if (filter) {
					if (!shapes.find(shape => shape.id === id).active) {
						filter.values.push(value.value);
					} else {
						filter.values = filter.values.filter(val => val !== value.value);
					}
				} else {
					newFilters.push({ name: value.field, values: [value.value] });
				}
			} else {
				if (!shapes.find(shape => shape.id === id).active) {
					newFilters.push({ name: value.field, values: [value.value] });
				} else if (shapes.find(shape => shape.id === id).active && shapes.filter(shape => shape.active).length > 1) {
					newFilters.push({ name: value.field, values: [value.value] });
				}
			}
		}

		for (let worksheet of selectedWorksheets) {
			const ws = dashboard.worksheets.find((ws: any) => ws.name === worksheet);
			if (ws) {
				if (newFilters.length === 0) {
					for (let dimension of JSON.parse(settings.dimensions)) {
						ws.clearFilterAsync(dimension).catch(console.log('Tried to clear filter, filter does not exist'));
					}
				} else {
					for (let filter of newFilters) {
						const updatetype = filter.values[0] === '' || filter.values.length === 0 ? tableau.FilterUpdateType.All : tableau.FilterUpdateType.Replace;
						ws.applyFilterAsync(filter.name, filter.values, updatetype).catch(console.log('Tried to filter worksheet, could not filter'));
					}
				}
			}
		}
		setFilters(newFilters);

		const newShapes = [...shapes];
		const currentActive = newShapes.filter(shape => shape.active).length;
		newShapes.map(shape => {
			if (shape.id === id) {
				if ((multiple && shape.active) || (!multiple && shape.active && currentActive <= 1)) {
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
		})
		setShapes(newShapes);
	}

	const handleClearFilters = (e: any) => {
		if (e.target.id === 'svgRoot') {
			clearFilters();
		}
	}

	const clearFilters = () => {
		if (configured) {
			const dashboard = tableau.extensions.dashboardContent.dashboard;
			const settings = tableau.extensions.settings.getAll();
			const selectedWorksheets = JSON.parse(settings.worksheets);
			const selectedDimensions = JSON.parse(settings.dimensions);
			for (let worksheet of selectedWorksheets) {
				const ws = dashboard.worksheets.find((ws: any) => ws.name === worksheet)
				if (ws) {
					for (let dimension of selectedDimensions) {
						ws.clearFilterAsync(dimension).catch(console.error('Tried to clear filter, filter does not exist'));
					}
				}
			}
			setFilters([]);
			// Make sure nothing is marked as active
			const newShapes = [...shapes];
			newShapes.map(shape => {
				shape.active = false;
				return shape;
			})
			setShapes(newShapes);
		} else {
			configure();
		}
	}

	useEffect(() => {
		window.addEventListener('resize', updateScale);
		return () => window.removeEventListener('resize', updateScale);
	})

	const checkScale = () => {
		if (tableau.extensions.settings) {
			const settings = tableau.extensions.settings.getAll();
			const image = document.getElementById('mappedImg') as HTMLImageElement;
			setImageDimensions([image.width, image.height]);

			if (!settings.imageDimensions) {
				tableau.extensions.settings.set('imageDimensions', JSON.stringify([image.width, image.height]));
				tableau.extensions.settings.saveAsync();
			} else if (JSON.stringify(imageDimensions) !== settings.imageDimensions) {
				updateScale();
			}
		}
	}

	const updateScale = () => {
		const image = document.getElementById('mappedImg') as HTMLImageElement;
		if (image && imageDimensions) {
			const newImageWidth = image.width;
			const newImageHeight = image.height;
			const oldImageWidth = imageDimensions[0];
			const oldImageHeight = imageDimensions[1];

			if (newImageWidth !== oldImageWidth || newImageHeight !== oldImageHeight) {
				let newShapes: Shape[] = [];
				for (let shape of shapes) {
					let newShape: Shape;
					const oldShapeX = shape.coords[0];
					const oldShapeY = shape.coords[1];
					const newShapeX = (oldShapeX / oldImageWidth) * newImageWidth;
					const newShapeY = (oldShapeY / oldImageHeight) * newImageHeight;
					switch (shape.type) {
						case 'ellipse':
							const oldShapeRX = shape.radius[0];
							const oldShapeRY = shape.radius[1];
							const newShapeRX = (oldShapeRX / oldImageWidth) * newImageWidth;
							const newShapeRY = (oldShapeRY / oldImageHeight) * newImageHeight;

							newShape = { ...shape, coords: [newShapeX, newShapeY], points: [[newShapeX, newShapeY]], radius: [newShapeRX, newShapeRY] };
							break;
						case 'rectangle':
							const oldShapeW = shape.dimensions[0];
							const oldShapeH = shape.dimensions[1];

							const newShapeW = (oldShapeW / oldImageWidth) * newImageWidth;
							const newShapeH = (oldShapeH / oldImageHeight) * newImageHeight;

							newShape = { ...shape, coords: [newShapeX, newShapeY], points: [[newShapeX, newShapeY]], dimensions: [newShapeW, newShapeH] };
							break;
						case 'lasso':
							const oldShapePoints = shape.points;
							let newShapePoints = []
							for (let point of oldShapePoints) {
								newShapePoints.push([
									(point[0] / oldImageWidth) * newImageWidth,
									(point[1] / oldImageHeight) * newImageHeight
								])
							}
							newShape = { ...shape, points: newShapePoints, originalPoints: newShapePoints };
							break;
						default:
							newShape = { ...shape };
							break;

					}
					newShapes = [...newShapes, newShape]
				}

				setShapes(newShapes);
				setImageDimensions([newImageWidth, newImageHeight]);
				tableau.extensions.settings.set('shapes', JSON.stringify(newShapes));
				tableau.extensions.settings.set('imageDimensions', JSON.stringify([newImageWidth, newImageHeight]));
				tableau.extensions.settings.saveAsync();
			}
		}
	}

	useEffect(() => {
		window.addEventListener('keydown', shortKeys);
		return () => window.removeEventListener('keydown', shortKeys);
	})

	const shortKeys = (e: any) => {
		if (mode === 'ellipse' || mode === 'rectangle' || mode === 'lasso') {
			switch (e.keyCode) {
				case 67:
					changeMode('ellipse');
					break;

				case 82:
					changeMode('rectangle');
					break;

				case 76:
					changeMode('lasso');
					break;

				default:
					break;
			}
		}
	}

	return (
		<>
			<div className={`spinner${loading ? '' : ' hidden'}`}><Spinner color='dark' /></div>
			<svg id='svgRoot' className='fullView' onMouseDown={handleShapeDown} onMouseMove={handleShapeDrag} onMouseUp={handleShapeUp} onMouseLeave={handleShapeUp}>
				{shapes.map(shape => <ShapeDisplay {...shape} key={shape.id} onClick={handleShapeDown} />)}
				{currentShape ? <ShapeDisplay {...currentShape} onClick={handleShapeDown} /> : ''}
			</svg>
			<div id='selectionBox' onMouseDown={handleCanvasDown} onMouseUp={handleCanvasUp} onMouseMove={handleCanvasDrag} className={`selection fullView${Object.values(modes.EDIT).includes(mode) && configured ? '' : ' hidden'}`} />
			<div className={scaling === 0 ? ' fitDiv' : ''}>
				<img id='mappedImg' onLoad={checkScale} src={image ? `data:image/png;base64, ${image.data}` : ''} className={`mappedImg${scaling === 0 ? ' fit' : ''}`} alt='' />
			</div>
			{configured && mode !== 'viewing' ? <Menu setMode={changeMode} mode={mode} /> : ''}
			<div className={`fullView noconfig${configured ? ' hidden' : ''}`}>Please configure extension</div>
		</>
	);
}

export default Home;
