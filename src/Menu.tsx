import React from 'react';
import { modes } from './Home';

const tooltips: { [index: string]: string } = {
	ellipse: 'Create Ellipse or Circle shape',
	lasso: 'Create Lasso shape',
	rectangle: 'Create Rectangle or Square shape',
	select: 'Edit shape',
	move: 'Reposition shape',
	testing: ' Test filtering',
};

function Menu(props: { setMode: Function; mode: string }) {
	return (
		<div className='menuBox' id='menuBox' data-mode={props.mode}>
			<Button onClick={props.setMode} mode={props.mode} action={modes.TESTING} />
			<div className='tooltip'>
				<div className={`option${Object.values(modes.EDIT).includes(props.mode) ? ' active' : ''}`} id='edit' title='Change edit mode'>
					<img className='svg' src={`./icons/edit.svg`} alt='Edit' />
				</div>
				<div className='tooltipbody'>
					{Object.values(modes.EDIT).map(mode => (
						<Button onClick={props.setMode} mode={props.mode} action={mode} key={mode} />
					))}
				</div>
			</div>
			<Button onClick={props.setMode} mode={props.mode} action={modes.SELECT} />
			<Button onClick={props.setMode} mode={props.mode} action={modes.MOVE} />
		</div>
	);
}

function Button(props: { onClick: Function; mode: string; action: string }) {
	const handleClick = () => props.onClick(props.action);
	return (
		<div className={`option${props.action === props.mode ? ' active' : ''}`} id={props.action} onClick={handleClick} title={tooltips[props.action]}>
			<img className={`svg`} src={`./icons/${props.action}.svg`} alt={props.action} />
		</div>
	);
}

export default Menu;
