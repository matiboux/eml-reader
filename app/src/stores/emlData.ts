import { atom } from 'nanostores'

const emlData = atom<Record<string, any> | null>(null)

export default emlData
