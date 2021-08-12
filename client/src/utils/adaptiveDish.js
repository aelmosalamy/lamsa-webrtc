// Responsible for beautifully adapting video grid to waste the least area possible
const Area = (Increment, Count, Width, Height, Margin = 10) => {
	let i = 0;
	let w = 0;
	let h = Increment * 0.75 + Margin * 2;
	while (i < Count) {
		if (w + Increment > Width) {
			w = 0;
			h = h + Increment * 0.75 + Margin * 2;
		}
		w = w + Increment + Margin * 2;
		i++;
	}
	if (h > Height) return false;
	else return Increment;
};

const Dish = () => {
	try {
		let Margin = 10;
		let Scenary = document.getElementById('VideoTiles__Row');
		let Width = Scenary.offsetWidth - Margin * 2;
		let Height = Scenary.offsetHeight - Margin * 2;
		let Cameras = document.getElementsByClassName(
			'VideoTiles__VideoWrapper'
		);
		let max = 0;

		let i = 1;
		while (i < 5000) {
			let w = Area(i, Cameras.length, Width, Height, Margin);
			if (w === false) {
				max = i - 1;
				break;
			}
			i++;
		}

		max = max - Margin * 2;
		setWidth(max, Margin);
	} catch (error) {
		console.error(error);
	}
};

const setWidth = (width, margin) => {
	try {
		let Cameras = document.getElementsByClassName(
			'VideoTiles__VideoWrapper'
		);
		for (var s = 0; s < Cameras.length; s++) {
			Cameras[s].style.width = width + 'px';
			Cameras[s].style.margin = margin + 'px';
			Cameras[s].style.height = width * 0.75 + 'px';
		}
	} catch (error) {
		console.log(error);
	}
};

export default Dish;
