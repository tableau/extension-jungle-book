import React from 'react';
import './Home.css';

const styles: any = {
    select: ' selectable',
    move: ' selectable',
    testing: ' hiddenFilter',
    viewing: ' hiddenFilter',
    ellipse: '',
    lasso: '',
    rectangle: '',
};

export function Lasso(props: any) {
    return (
        <>
            <polygon id={props.id} className={`filter${styles[props.mode]}${props.active ? ' activeFilter' : ''}`} points={props.points.join(' ')} onClick={props.onClick} />
        </>
    );
}

export function Ellipse(props: any) {
    return (
        <>
            <ellipse id={props.id} className={`filter${styles[props.mode]}${props.active ? ' activeFilter' : ''}`} cx={props.coords[0]} cy={props.coords[1]} rx={props.radius[0]} ry={props.radius[1]} onClick={props.onClick}/>
        </>
    );
}

export function Rectangle(props: any) {
    return (
        <>
            <rect id={props.id} className={`filter${styles[props.mode]}${props.active ? ' activeFilter' : ''}`} x={props.coords[0]} y={props.coords[1]} width={props.dimensions[0]} height={props.dimensions[1]} onClick={props.onClick}/>
        </>
    );
}
