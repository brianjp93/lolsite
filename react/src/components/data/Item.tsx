import {useState, useRef, useEffect, useCallback} from 'react'
import Popover from 'react-tiny-popover'

export function Item(props: any) {
  return (
    <div style={{...props.tooltip_style}}>
      {props.item === null && <span>Retrieving item...</span>}
      {props.item !== null && (
        <div>
          <div>
            <span style={{textDecoration: 'underline'}}>{props.item.name}</span>{' '}
            <span style={{color: 'gold'}}>{props.item.gold.total}</span>
          </div>
          <div>
            <small dangerouslySetInnerHTML={{__html: props.item.description}}></small>
          </div>
        </div>
      )}
    </div>
  )
}

export function ItemPopover(props: any) {
  const [isOpen, setIsOpen] = useState(false)
  const [isAttemptedGet, setIsAttemptedGet] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleOutsideClick = useCallback((event) => {
    if (ref?.current) {
      if (ref.current.contains(event.target)) { }
      else if (isOpen) {
        setIsOpen(false);
      }
    }
  }, [isOpen, ref])

  const toggle = useCallback(() => {
    setIsOpen((state) => !state)
    if (props.item === null && !isAttemptedGet) {
      if (props.item_id) {
        props.getItem(props.item_id, props.major, props.minor, props.store)
        setIsAttemptedGet(true)
      }
    }
  }, [isAttemptedGet, props.item, props.item_id])

  useEffect(() => {
    if (props.item_id) {
      window.addEventListener('mousedown', handleOutsideClick);
      return () => {
        window.removeEventListener('mousedown', handleOutsideClick);
      }
    }
  }, [handleOutsideClick])

  if (props.item_id) {
    return (
      <Popover
        transitionDuration={0.01}
        isOpen={isOpen}
        position={'top'}
        containerStyle={{zIndex: '11'}}
        content={<Item item={props.item} tooltip_style={props.tooltip_style} />}
      >
        <div ref={ref} style={{...props.style, cursor: 'pointer'}} onClick={toggle}>
          {props.children}
        </div>
      </Popover>
    )
  } else {
    return <div style={props.style}>{props.children}</div>
  }
}
