const doesRoomExist = async (id) => {
  return await fetch(`${process.env.SERVER_URI}/channels/${id}/exists`)
}

export default doesRoomExist

