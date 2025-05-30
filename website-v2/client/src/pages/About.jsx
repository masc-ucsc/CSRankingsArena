import React from 'react';
import { Typography, Space, Row, Col, Card, Divider } from 'antd';
import { 
  GithubOutlined, 
  LinkedinOutlined, 
  GlobalOutlined,
  CodeOutlined,
  RocketOutlined,
  TeamOutlined,
  ExperimentOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import Header from '../components/Header';
import Footer from '../components/Footer';

const { Title, Text, Paragraph } = Typography;

const About = () => {
  return (
    <div className="about-page">
      <Header />
      
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
        </div>
      </section>

      <main className="container">
        {/* Mission Section */}
        <section className="mission-section">
          <Row gutter={[64, 48]} align="middle">
            <Col xs={24} lg={12}>
              <Space direction="vertical" size="large">
                <Title level={2} className="section-title">Our Mission</Title>
                <Paragraph className="mission-text">
                  The Micro Architecture at Santa Cruz (MASC) group at UC Santa Cruz is dedicated to advancing computer architecture research. 
                  Through CSRankingsArena, we provide researchers with powerful tools to analyze, visualize, and understand research trends 
                  in computer science.
                </Paragraph>
                <Space size="middle" wrap>
                  <a 
                    href="https://masc.soe.ucsc.edu/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mission-cta primary"
                  >
                    Visit MASC Website
                  </a>
                  <a 
                    href="https://github.com/masc-ucsc/CSRankingsArena" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mission-cta secondary"
                  >
                    <GithubOutlined /> View on GitHub
                  </a>
                </Space>
              </Space>
            </Col>
            <Col xs={24} lg={12}>
              <div className="mission-visual">
                <div className="visual-element">
                  <ExperimentOutlined className="feature-icon" />
                </div>
              </div>
            </Col>
          </Row>
        </section>

        <Divider className="section-divider" />

        {/* Features Section */}
        <section className="features-section">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={2} className="section-title">Platform Features</Title>
            <Row gutter={[32, 32]}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="feature-card">
                  <Space direction="vertical" size="large" align="center">
                    <DatabaseOutlined className="feature-icon" />
                    <Title level={4}>Data Analysis</Title>
                    <Text>Comprehensive research paper analysis and visualization tools</Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="feature-card">
                  <Space direction="vertical" size="large" align="center">
                    <TeamOutlined className="feature-icon" />
                    <Title level={4}>Collaboration</Title>
                    <Text>Connect with researchers and share insights</Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="feature-card">
                  <Space direction="vertical" size="large" align="center">
                    <RocketOutlined className="feature-icon" />
                    <Title level={4}>Performance</Title>
                    <Text>Fast and efficient data processing capabilities</Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="feature-card">
                  <Space direction="vertical" size="large" align="center">
                    <CodeOutlined className="feature-icon" />
                    <Title level={4}>Open Source</Title>
                    <Text>Contribute and customize the platform</Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Space>
        </section>

        <Divider className="section-divider" />

        {/* Team Section */}
        <section className="team-section">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={2} className="section-title">Our Team</Title>
            <Row gutter={[32, 32]}>
              <Col xs={24} md={12}>
                <Card className="team-card">
                  <Space direction="vertical" size="large" align="center">
                    <div className="member-avatar">
                      <GlobalOutlined />
                    </div>
                    <Space direction="vertical" size="small" align="center">
                      <Title level={3}>Project Owner</Title>
                      <Text strong className="member-name">Jose Renau</Text>
                      <Text type="secondary" className="member-role">UC Santa Cruz</Text>
                      <a href="https://users.soe.ucsc.edu/~renau/" target="_blank" rel="noopener noreferrer" className="social-link">
                        <GlobalOutlined />
                      </a>
                    </Space>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card className="team-card">
                  <Space direction="vertical" size="large" align="center">
                    <div className="member-avatar">
                      <LinkedinOutlined />
                    </div>
                    <Space direction="vertical" size="small" align="center">
                      <Title level={3}>Tech Lead</Title>
                      <Text strong className="member-name">Devanathan NG</Text>
                      <Text type="secondary" className="member-role">UC Santa Cruz</Text>
                      <a href="https://www.linkedin.com/in/devanathan-ng/" target="_blank" rel="noopener noreferrer" className="social-link">
                        <LinkedinOutlined />
                      </a>
                    </Space>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Space>
        </section>

        <Divider className="section-divider" />

        {/* Support Section */}
        <section className="support-section">
          <Space direction="vertical" size="large" align="center" style={{ width: '100%' }}>
            <Title level={2}>Get Involved</Title>
            <Paragraph className="support-text">
              Join our community of researchers and developers. Your feedback and contributions 
              help us create a better platform for the research community.
            </Paragraph>
            <Space size="middle" wrap>
              <a 
                href="https://github.com/masc-ucsc/CSRankingsArena/issues" 
                target="_blank" 
                rel="noopener noreferrer"
                className="github-link"
              >
                <GithubOutlined /> Raise an Issue
              </a>
              <a 
                href="https://github.com/masc-ucsc/CSRankingsArena" 
                target="_blank" 
                rel="noopener noreferrer"
                className="github-link secondary"
              >
                <CodeOutlined /> Contribute
              </a>
            </Space>
          </Space>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About; 