import PostalMime, { type Address } from 'postal-mime'

export interface EmlAddress
{
	name: string
	email: string
}

export interface EmlAttachment
{
	/** File name, if any */
	name: string | null
	/** MIME type, without parameters */
	contentType: string
	/** Content-ID with angle brackets, as referenced by `cid:` links */
	id: string | null
	/** Attachment content, base64-encoded */
	data64: string
	/** Decoded size in bytes */
	size: number
}

export interface EmlData
{
	/** Headers in document order. Repeated headers are joined with ", " */
	headers: Record<string, string>
	subject?: string | undefined
	from?: EmlAddress | undefined
	to?: EmlAddress[]
	cc?: EmlAddress[]
	date?: Date | undefined
	html?: string | undefined
	text?: string | undefined
	/** Absent when the e-mail has no attachment */
	attachments?: EmlAttachment[] | undefined
}

export class InvalidEmlError extends Error
{
	constructor(message = 'Invalid EML file')
	{
		super(message)
		this.name = 'InvalidEmlError'
	}
}

/** Headers that mark a real message, as opposed to an arbitrary text file */
const MESSAGE_HEADERS = /^(from|to|cc|subject|date|message-id|content-type|mime-version|received|return-path)$/

/** Strip a pair of surrounding quotes from a string */
export function unquoteString(value: string | null | undefined): string | null
{
	if (value === null || value === undefined)
	{
		return null
	}
	return value.replace(/^\s*(["'])(.*)\1\s*$/s, '$2')
}

function flatten(addresses: Address[] | Address | undefined): EmlAddress[]
{
	if (!addresses)
	{
		return []
	}
	const list = Array.isArray(addresses) ? addresses : [addresses]
	return list
		.flatMap((address) =>
			address.group
				? address.group.map((member) => ({ name: member.name, email: member.address ?? '' }))
				: [{ name: address.name, email: address.address ?? '' }],
		)
		.filter((address) => address.email || address.name)
}

/**
 * Parse the raw bytes of an .eml file.
 * Reading bytes (not text) lets raw 8-bit parts be decoded with their declared charset.
 * Throws InvalidEmlError for files that aren't an email.
 */
export async function parseEml(raw: ArrayBuffer | Uint8Array): Promise<EmlData>
{
	const parsed = await PostalMime.parse(raw, {
		attachmentEncoding: 'base64',
		// Keep forwarded e-mails as attachments instead of flattening them
		forceRfc822Attachments: true,
	})

	if (!parsed.headers.some((header) => MESSAGE_HEADERS.test(header.key)))
	{
		throw new InvalidEmlError()
	}

	const headers: Record<string, string> = {}
	for (const header of parsed.headers)
	{
		const key = header.originalKey || header.key
		headers[key] = key in headers ? `${headers[key]}, ${header.value}` : header.value
	}

	const date = parsed.date ? new Date(parsed.date) : undefined

	return {
		headers,
		subject: parsed.subject || undefined,
		from: flatten(parsed.from)[0],
		to: flatten(parsed.to),
		cc: flatten(parsed.cc),
		date: date && !Number.isNaN(date.getTime()) ? date : undefined,
		html: parsed.html || undefined,
		text: parsed.text || undefined,
		attachments: parsed.attachments.length <= 0 ? undefined : parsed.attachments.map((attachment) =>
		{
			const data64 = typeof attachment.content === 'string' ? attachment.content : ''
			const padding = data64.endsWith('==') ? 2 : data64.endsWith('=') ? 1 : 0
			return {
				name: attachment.filename,
				contentType: attachment.mimeType,
				id: attachment.contentId ?? null,
				data64,
				size: Math.floor(data64.length * 3 / 4) - padding,
			}
		}),
	}
}
