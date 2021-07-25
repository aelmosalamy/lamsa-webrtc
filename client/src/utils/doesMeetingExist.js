const doesRoomExist = async (id) => {
  return await fetch(`localhost:5000/channels/${id}/exists`)
}

export default doesRoomExist

