import { atom } from 'nanostores'

const openedAttachmentIndex = atom<number | null>(null)

export default openedAttachmentIndex
