import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  School,
  Group,
  CheckCircle,
  TrendingUp,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('🔍 Carregando dashboard para user:', user);
      console.log('📡 API URL:', process.env.REACT_APP_API_URL);
      
      // Carrega estatísticas do professor
      const statsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/professors/${user.id}/stats`
      );
      console.log('✅ Stats carregadas:', statsResponse.data);
      setStats(statsResponse.data);

      // Carrega dados de presença dos últimos 7 dias
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return format(date, 'yyyy-MM-dd');
      });

      const attendancePromises = last7Days.map(async (date) => {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/attendance`,
          {
            params: {
              startDate: `${date}T00:00:00`,
              endDate: `${date}T23:59:59`,
            },
          }
        );
        return {
          date: format(new Date(date), 'dd/MM', { locale: ptBR }),
          fullDate: date,
          count: response.data.length,
        };
      });

      const attendanceResults = await Promise.all(attendancePromises);
      console.log('✅ Attendance data carregada:', attendanceResults);
      setAttendanceData(attendanceResults);
    } catch (err) {
      console.error('❌ Erro ao carregar dados do dashboard:', err);
      console.error('❌ Detalhes do erro:', err.response?.data || err.message);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const statCards = [
    {
      title: 'Total de Turmas',
      value: stats?.totalClasses || 0,
      icon: <School sx={{ fontSize: 40 }} />,
      color: '#1976D2',
    },
    {
      title: 'Total de Alunos',
      value: stats?.totalStudents || 0,
      icon: <Group sx={{ fontSize: 40 }} />,
      color: '#10B981',
    },
    {
      title: 'Presenças Hoje',
      value: stats?.attendanceToday || 0,
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      color: '#F59E0B',
    },
    {
      title: 'Taxa de Presença',
      value: `${stats?.attendanceRate || 0}%`,
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: '#8B5CF6',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Bem-vindo, {user?.name}!
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Visão geral do sistema de presença
      </Typography>

      {/* Cards de métricas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              elevation={2}
              sx={{
                height: '100%',
                borderLeft: `4px solid ${card.color}`,
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gráfico de presenças */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Presenças dos Últimos 7 Dias
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: 8,
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#1976D2"
              strokeWidth={3}
              dot={{ fill: '#1976D2', r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
