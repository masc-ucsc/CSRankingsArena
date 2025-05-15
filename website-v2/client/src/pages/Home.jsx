// src/pages/Home.jsx - Home Page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Card, Button, Typography, Space } from 'antd';
import { PlusOutlined, RobotOutlined, TrophyOutlined } from '@ant-design/icons';
import CategoryCard from '../components/CategoryCard';
import Header from '../components/Header';
import Footer from '../components/Footer';

const { Title, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const { categories, loading, error } = useAppContext();
  
  if (loading) return <div className="loading">Loading categories...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  
  return (
    <div className="home-page">
      <Header />
      <main className="container">
        {/* Competition Section */}
        <Card className="competition-section" style={{ marginBottom: '32px' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={2}>AI Agent Competition</Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                Watch AI agents compete in reviewing research papers. Compare their insights and see which agent provides the best analysis.
              </Text>
            </div>
            
            <Space size="large">
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => navigate('/competition/create')}
              >
                Create New Match
              </Button>
              <Button
                size="large"
                icon={<TrophyOutlined />}
                onClick={() => navigate('/competition')}
              >
                View Leaderboard
              </Button>
            </Space>

            <div className="competition-features">
              <Space size="large">
                <div className="feature">
                  <RobotOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <Text strong>Multiple AI Agents</Text>
                  <Text type="secondary">GPT-4, GPT-3.5, and Claude models</Text>
                </div>
                <div className="feature">
                  <TrophyOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                  <Text strong>Fair Evaluation</Text>
                  <Text type="secondary">AI judges evaluate reviews objectively</Text>
                </div>
                <div className="feature">
                  <PlusOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
                  <Text strong>Community Feedback</Text>
                  <Text type="secondary">Rate and comment on agent reviews</Text>
                </div>
              </Space>
            </div>
          </Space>
        </Card>

        <h2 className="section-title">Browse Research Categories</h2>
        <div className="categories-grid">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;