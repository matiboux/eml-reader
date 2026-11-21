import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

import { InvalidEmlError, parseEml, unquoteString } from '../../src/lib/parseEml'

const fixture = (name: string) => fs.readFileSync(path.join(import.meta.dirname, '..', 'fixtures', name))

describe('parseEml', () =>
{
	test('reads the header fields and body', async () =>
	{
		const eml = await parseEml(fixture('plain.eml'))
		expect(eml.subject).toBe('Your parcel is on its way')
		expect(eml.from?.email).toBe('noreply@example.org')
		expect(eml.to?.map((address) => address.email)).toEqual(['m@example.com'])
		expect(eml.date?.toISOString()).toBe('2026-11-15T09:05:00.000Z')
		expect(eml.text).toContain('Your parcel will arrive tomorrow')
		expect(eml.headers['Subject']).toBe('Your parcel is on its way')
		expect(eml.attachments).toBeUndefined()
	})

	test('exposes attachments as base64 with their decoded size', async () =>
	{
		const source = [
			'From: a@example.com',
			'To: b@example.com',
			'Subject: Attached',
			'MIME-Version: 1.0',
			'Content-Type: multipart/mixed; boundary="b"',
			'',
			'--b',
			'Content-Type: text/plain',
			'',
			'See attached.',
			'--b',
			'Content-Type: text/plain; name="hello.txt"',
			'Content-Disposition: attachment; filename="hello.txt"',
			'Content-Transfer-Encoding: base64',
			'',
			'aGVsbG8gd29ybGQ=',
			'--b--',
			'',
		].join('\r\n')
		const eml = await parseEml(new TextEncoder().encode(source))
		expect(eml.attachments).toHaveLength(1)
		expect(eml.attachments![0]).toMatchObject({
			name: 'hello.txt',
			contentType: 'text/plain',
			data64: 'aGVsbG8gd29ybGQ=',
			size: 11,
		})
	})

	test('a raw 8-bit ISO-8859-1 body is decoded', async () =>
	{
		const eml = await parseEml(fixture('latin1-8bit.eml'))
		expect(eml.text).toContain('Café, crème brûlée en één ü')
	})

	test('mixed charsets decode per part, including raw 8-bit headers', async () =>
	{
		const eml = await parseEml(fixture('mixed-8bit.eml'))
		expect(eml.subject).toBe('Menú van de week')
		expect(eml.from?.name).toBe('Zoë')
		expect(eml.text).toContain('één ü — prijs € 12')
		expect(eml.html).toContain('één ü — prijs € 12')
	})

	test('a file that is not an email is rejected', async () =>
	{
		await expect(parseEml(fixture('not-an-email.eml'))).rejects.toBeInstanceOf(InvalidEmlError)
	})
})

describe('unquoteString', () =>
{
	test('strips surrounding quotes only', () =>
	{
		expect(unquoteString('"a b"')).toBe('a b')
		expect(unquoteString("'a'")).toBe('a')
		expect(unquoteString('a"b')).toBe('a"b')
		expect(unquoteString(null)).toBeNull()
	})
})
