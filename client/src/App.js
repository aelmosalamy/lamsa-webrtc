import './App.css'
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom'

import { Button } from 'react-bootstrap'
import HomeScreen from './screens/HomeScreen'

function App() {
	return (
		<Router>
			<Switch>
				<Route path='/'>
					<HomeScreen />
				</Route>
				<Route path='/test'>
					<p>testttttt</p>
				</Route>
			</Switch>
		</Router>
	)
}

export default App
