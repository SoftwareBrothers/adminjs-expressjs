import AdminJS from 'adminjs'

export const normalizeAdminPath = (admin: AdminJS, adminPath: string): string => {
  const { rootPath } = admin.options.paths ?? {}

  const normalizedLoginPath = adminPath.replace(rootPath, '')

  return normalizedLoginPath.startsWith('/') ? normalizedLoginPath : `/${normalizedLoginPath}`
}

export const convertToExpressPath = (adminRoute: string): string => adminRoute.replace(/{/g, ':').replace(/}/g, '')
