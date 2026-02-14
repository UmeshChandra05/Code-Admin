import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminLogin } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Lock, User } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    eid: '',
    password: '',
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.eid.trim() || !form.password.trim()) {
      toast.error('Please enter both EID and password');
      return;
    }

    setLoading(true);

    try {
      const response = await adminLogin(form.eid, form.password);

      // Backend returns: { success: true, message: "...", data: { user, accessToken, expiresAt } }
      const { accessToken, user } = response.data || response;

      if (accessToken && user) {
        login(accessToken, user);
        toast.success(`Login successful! Welcome ${user.name}`);
        navigate('/admin');
      } else {
        toast.error('Login response missing required data.');
      }
    } catch (err: any) {
      let errorMessage = 'Login failed. ';

      if (err.message.includes('Network') || err.message.includes('ERR_CONNECTION')) {
        errorMessage += 'Cannot connect to server. Make sure backend is running on ' + import.meta.env.VITE_API_BASE_URL;
      } else if (err.message.includes('credentials') || err.message.includes('Invalid')) {
        errorMessage += 'Invalid credentials. Please check your EID and password.';
      } else {
        errorMessage += err.message || 'Unknown error occurred.';
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eid">Employee ID</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="eid"
                  type="text"
                  placeholder="Enter your EID"
                  value={form.eid}
                  onChange={(e) => setForm({ ...form, eid: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pl-10"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-6 space-y-2">
            <div className="text-center text-sm text-muted-foreground">
              <p>CodeCanvas Admin Panel</p>
            </div>
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <p className="font-semibold mb-1">💡 Test Credentials:</p>
              <p>EID: <code className="bg-background px-1 rounded">admin@email.com</code></p>
              <p>Password: <code className="bg-background px-1 rounded">Admin@123</code></p>
              <p className="mt-2 text-[10px]">API: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
