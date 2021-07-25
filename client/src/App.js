import './App.css';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';

import { Button } from 'react-bootstrap';
import HomeScreen from './screens/HomeScreen';
import MeetingScreen from './screens/MeetingScreen';

function App() {
	return (
		<Router>
			<div className="App">
				<div className="App-background"></div>
				<div className="App-overlay"></div>
				<div style={{ position: 'relative' }}>
					<Switch>
						{/* Route order matters, due to precedence */}
						<Route path="/:meeting_id" component={MeetingScreen} />
						<Route path="/" component={HomeScreen} />
					</Switch>
				</div>
			</div>
		</Router>
	);
}

export default App;
