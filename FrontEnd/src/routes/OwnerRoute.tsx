
import { Navigate } from 'react-router-dom'
import {
  getToken,
  getStoredUser,
} from '../services/auth.service'

type OwnerRouteProps = {
  children: React.ReactNode
}

function OwnerRoute({ children }: OwnerRouteProps) {
  const token = getToken()
  const user = getStoredUser()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'OWNER') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default OwnerRoute
