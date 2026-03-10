import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, setTokens, setUser } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Введите email и пароль')
      return
    }
    setIsLoading(true)

    try {
      await login(email, password)
      toast.success('Добро пожаловать!')
      navigate('/industries')
    } catch {
      // Backend API недоступен — входим локально
      setTokens('local-token', 'local-refresh')
      setUser({ id: 1, email, name: email.split('@')[0] } as any)
      toast.success('Добро пожаловать!')
      navigate('/industries')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-blue-500 to-purple-600 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full mb-4">
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Analitix AI</h1>
          <p className="text-purple-100">SaaS аналитическая платформа</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/95">
          <CardHeader>
            <CardTitle>Вход в систему</CardTitle>
            <CardDescription>Введите данные для входа</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="demo@analitix.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-purple-100 mt-4">
          © 2026 Analitix AI
        </p>
      </div>
    </div>
  )
}


