import { nanoid } from 'nanoid'

const generateRoomId = () => {
	return nanoid(8)
}

export default generateRoomId
