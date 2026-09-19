import React, { useEffect } from 'react'
import { useUserStore } from '@stores/user_storage'
import { client } from '@config/client'

interface SetUserFromApiProps {
  email: string | undefined
}

const SetUserFromApi: React.FC<SetUserFromApiProps> = ({ email }) => {
  useEffect(() => {
    if (!email) return;
    
    client.get(`/api/v1/auth/users/find-by-email?email=${encodeURIComponent(email)}`)
      .then(res => {
        // Only set user if response is a valid user object
        if (
          res.status === 200 &&
          res.data &&
          typeof res.data === 'object' &&
          res.data.email &&
          res.data.id
        ) {
          useUserStore.getState().setUser(res.data)
        } else {
          // Log unexpected response for debugging
          console.warn('Invalid user response:', res.data)
        }
      })
      .catch((err) => {
        console.error('Failed to fetch user:', err)
      })
  }, [email])

  return null
}

export default SetUserFromApi
