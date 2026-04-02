import AuthCard from '@/components/login/AuthCard'
import ForgotPasswordClient from '@/components/login/Forgotpasswordclient/Forgotpasswordclient'
import React from 'react'

const ForgotPage = () => {
  return (
       <section className="py-12 lg:py-20">
          <div className="container max-w-md">
            <AuthCard>

  <div className="text-center space-y-1">
      <ForgotPasswordClient/>
    </div>
            </AuthCard>
            </div>
            </section>
  )
}

export default ForgotPage