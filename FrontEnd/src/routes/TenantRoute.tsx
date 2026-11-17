
import { Navigate } from 'react-router-dom'
import {
  getToken,
  getStoredUser,
} from '../services/auth.service'

type TenantRouteProps = {
  children: React.ReactNode
}

function TenantRoute({ children }: TenantRouteProps) {
  const token = getToken()
  const user = getStoredUser()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'TENANT') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default TenantRoute
