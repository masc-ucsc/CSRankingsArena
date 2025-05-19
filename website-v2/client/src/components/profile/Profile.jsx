import React from 'react';
import { Card, Avatar, Space, Typography, Tag, Divider } from 'antd';
import { GithubOutlined, UserOutlined, MailOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const { Title, Text } = Typography;

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Avatar 
              size={120} 
              src={user.avatar_url} 
              icon={<UserOutlined />}
            />
            <Title level={2} style={{ marginTop: 16, marginBottom: 8 }}>
              {user.username}
            </Title>
            <Tag icon={<GithubOutlined />} color="blue">
              GitHub User
            </Tag>
          </div>

          <Divider />

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">
                <MailOutlined /> Email
              </Text>
              <div>
                <Text strong>{user.email || 'Not provided'}</Text>
              </div>
            </div>

            <div>
              <Text type="secondary">
                <CalendarOutlined /> Member Since
              </Text>
              <div>
                <Text strong>
                  {format(new Date(user.created_at), 'MMMM d, yyyy')}
                </Text>
              </div>
            </div>
          </Space>
        </Space>
      </Card>
    </div>
  );
};

export default Profile; 