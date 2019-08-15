import React, { useState } from 'react';
import { modes } from './Home';

function Menu(props: any) {
    return (
        <div className='menuBox' id='menuBox' data-mode={props.mode}>
            <ToggleButton setMode={props.setMode} mode={props.mode} />
            {props.mode === 'testing' ? '' :
                <div>
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
            }
        </div>
    );
}

function Button(props: any) {
    const handleClick = () => props.onClick(props.action);
    return (
        <div className={`option${props.action === props.mode ? ' active' : ''}`} id={props.action} onClick={handleClick} title={props.action}>
            <img className={`svg${(props.action === 'save' && !props.saved) ? ' notSaved' : ''}`} src={`./icons/${props.action}.svg`} alt={props.action} />
        </div>
    );
}

function ToggleButton(props: any) {
    const [lastMode, saveLastMode] = useState(props.mode);

    const toggle = () => {
        saveLastMode(props.mode)
        props.setMode(props.mode === 'testing' ? lastMode : 'testing')
    };

    return (
        <div className='toggleBox' onClick={toggle}>
            <img className='toggleIcon' alt='Toggle edit mode' src={`./icons/toggle.svg`} />
        </div>
    );
}

export default Menu;
