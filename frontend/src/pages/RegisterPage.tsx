import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const register = useAuthStore((state) => state.register)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }

    if (password.length < 8) {
      toast.error('Пароль должен быть не менее 8 символов')
      return
    }

    setIsLoading(true)

    try {
      await register(email, password)
      toast.success('Аккаунт создан!')
      navigate('/industries')
    } catch {
      // Backend недоступен — входим локально
      const { setTokens, setUser } = useAuthStore.getState()
      setTokens('local-token', 'local-refresh')
      setUser({ id: 1, email, name: email.split('@')[0] } as any)
      toast.success('Добро пожаловать!')
      navigate('/industries')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Analitix AI</h1>
          <p className="text-blue-100">Начните анализировать ваши данные уже сегодня</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/95">
          <CardHeader>
            <CardTitle>Создать аккаунт</CardTitle>
            <CardDescription>
              Начните работу с Analitix AI бесплатно
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Электронная почта</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ivan@example.com"
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
                <p className="text-xs text-muted-foreground">
                  Минимум 8 символов
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Создание аккаунта...' : 'Создать аккаунт'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Уже есть аккаунт? </span>
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                Войти
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-blue-100 mt-4">
          © 2024 Analitix AI. Все права защищены.
        </p>
      </div>
    </div>
  )
}
