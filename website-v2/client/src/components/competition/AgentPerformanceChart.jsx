import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col, Spin, Radio, Space, Statistic } from 'antd';
import { Line, Bar, Radar } from '@ant-design/plots';
import { StarOutlined } from '@ant-design/icons';
import { competitionService } from '../../services/competitionService';

const { Title } = Typography;

const AgentPerformanceChart = ({ agentId, timeRange = 'week' }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    loadStats();
  }, [agentId, timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await competitionService.getAgentStats(agentId);
      setStats(data);
    } catch (error) {
      console.error('Error loading agent stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderRatingTrend = () => {
    if (!stats?.rating_history) return null;

    const config = {
      data: stats.rating_history,
      xField: 'date',
      yField: 'rating',
      point: {
        size: 5,
        shape: 'diamond',
      },
      label: {
        style: {
          fill: '#aaa',
        },
      },
      smooth: true,
      tooltip: {
        formatter: (datum) => {
          return { name: 'Rating', value: datum.rating.toFixed(1) };
        },
      },
    };

    return <Line {...config} />;
  };

  const renderPerformanceMetrics = () => {
    if (!stats?.metrics) return null;

    const data = [
      { metric: 'Technical Accuracy', value: stats.metrics.technical_accuracy },
      { metric: 'Clarity', value: stats.metrics.clarity },
      { metric: 'Originality', value: stats.metrics.originality },
      { metric: 'Relevance', value: stats.metrics.relevance },
      { metric: 'Depth', value: stats.metrics.depth },
    ];

    const config = {
      data,
      xField: 'metric',
      yField: 'value',
      label: {
        position: 'middle',
        style: {
          fill: '#FFFFFF',
          opacity: 0.6,
        },
      },
      meta: {
        value: {
          alias: 'Score',
          min: 0,
          max: 1,
        },
      },
    };

    return <Bar {...config} />;
  };

  const renderRadarChart = () => {
    if (!stats?.metrics) return null;

    const data = [
      {
        metric: 'Technical Accuracy',
        value: stats.metrics.technical_accuracy,
      },
      {
        metric: 'Clarity',
        value: stats.metrics.clarity,
      },
      {
        metric: 'Originality',
        value: stats.metrics.originality,
      },
      {
        metric: 'Relevance',
        value: stats.metrics.relevance,
      },
      {
        metric: 'Depth',
        value: stats.metrics.depth,
      },
    ];

    const config = {
      data,
      xField: 'metric',
      yField: 'value',
      meta: {
        value: {
          alias: 'Score',
          min: 0,
          max: 1,
        },
      },
      xAxis: {
        line: null,
        tickLine: null,
      },
      yAxis: {
        label: false,
        grid: {
          alternateColor: 'rgba(0, 0, 0, 0.04)',
        },
      },
      point: {
        size: 2,
      },
      area: {
        style: {
          fill: 'rgba(24, 144, 255, 0.2)',
        },
      },
    };

    return <Radar {...config} />;
  };

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div className="agent-performance-chart">
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>Performance Analytics</Title>
            <Radio.Group value={chartType} onChange={e => setChartType(e.target.value)}>
              <Radio.Button value="line">Trend</Radio.Button>
              <Radio.Button value="bar">Metrics</Radio.Button>
              <Radio.Button value="radar">Radar</Radio.Button>
            </Radio.Group>
          </div>

          <Row gutter={[16, 16]}>
            <Col span={24}>
              {chartType === 'line' && renderRatingTrend()}
              {chartType === 'bar' && renderPerformanceMetrics()}
              {chartType === 'radar' && renderRadarChart()}
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="Win Rate"
                  value={stats?.win_rate || 0}
                  precision={2}
                  suffix="%"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="Average Rating"
                  value={stats?.avg_rating || 0}
                  precision={1}
                  prefix={<StarOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="Total Matches"
                  value={stats?.total_matches || 0}
                />
              </Card>
            </Col>
          </Row>
        </Space>
      </Card>
    </div>
  );
};

export default AgentPerformanceChart; 