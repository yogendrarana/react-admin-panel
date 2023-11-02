import {React} from 'react'

//importing css
import './Spinner.css'

const Spinner = ({style}) => {
	return (
		<div className="spinner-container" style={style}>
			<div className="spinner"></div>
		</div>
	)
}

export default Spinner