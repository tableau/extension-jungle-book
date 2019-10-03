import React from 'react';
import { Shape, ShapeGenerator } from './Home';
import './Home.css';

const styles: { [index: string]: string } = {
	select: ' selectable',
	move: ' selectable',
	testing: ' hiddenFilter',
	viewing: ' hiddenFilter',
	ellipse: '',
	lasso: '',
	rectangle: '',
};

export interface ShapeProps extends Shape {
	mode: string;
	title: string;
}

export const Lasso: ShapeGenerator = (props: ShapeProps) => {
	return (
		<>
			<polygon id={props.id} className={`filter${styles[props.mode]}${props.active ? ' activeFilter' : ''}`} points={props.points.join(' ')} onClick={props.onClick} />
		</>
	);
}

export const Ellipse: ShapeGenerator = (props: ShapeProps) => {
	return (
		<>
			<ellipse id={props.id} className={`filter${styles[props.mode]}${props.active ? ' activeFilter' : ''}`} cx={props.coords[0]} cy={props.coords[1]} rx={props.radius[0]} ry={props.radius[1]} onClick={props.onClick} />
		</>
	);
}

export const Rectangle: ShapeGenerator = (props: ShapeProps) => {
	return (
		<>
			<rect id={props.id} className={`filter${styles[props.mode]}${props.active ? ' activeFilter' : ''}`} x={props.coords[0]} y={props.coords[1]} width={props.dimensions[0]} height={props.dimensions[1]} onClick={props.onClick} />
		</>
	);
}
