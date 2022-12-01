export default function Orbit(props) {
    let size = props.size === undefined ? 100: props.size
    let color = props.color === undefined ? '#426892': props.color
    let orbit_style = {borderColor: color}
    return (
        <div
            style={{
                ...props.style,
                'width': size,
                'height': size,
            }}
            className="orbit-spinner">
          <div style={orbit_style} className="orbit"></div>
          <div style={orbit_style} className="orbit"></div>
          <div style={orbit_style} className="orbit"></div>
        </div>
    )
}

