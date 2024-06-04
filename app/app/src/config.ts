interface Site
{
	title: string
	description?: string
	author?: string
	themeColor?: string
}

export const site: Site = {
	title: 'EML Reader',
	description: 'Online tool to read and display the content of an EML file.',
	author: 'Matiboux',
	themeColor: '#ffffff',
}
