import React from 'react';
import { Card, Typography, Space, Row, Col, Divider, Button } from 'antd';
import { 
  GithubOutlined, 
  LinkedinOutlined, 
  GlobalOutlined,
  CodeOutlined
} from '@ant-design/icons';
import Header from '../components/Header';
import Footer from '../components/Footer';

const { Title, Text, Paragraph } = Typography;

const About = () => {
  return (
    <div className="about-page">
      <Header />
      <div className="about-hero">
        <div className="hero-content">
          <Title level={1} className="hero-title">About CSRankingsArena</Title>
          <Paragraph className="hero-subtitle">
            A Research Analysis Platform by MASC UCSC
          </Paragraph>
          <div className="hero-stats">
            <div className="stat-item">
              <CodeOutlined />
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </div>

      <main className="container">
        <div className="mission-section glass-effect">
          <Row gutter={[48, 48]} align="middle">
            <Col xs={24} md={12}>
              <div className="mission-content">
                <Title level={2}>About MASC UCSC</Title>
                <Paragraph className="mission-text">
                  The Micro Architecture at Santa Cruz (MASC) group at UC Santa Cruz focuses on computer architecture research. 
                  Founded in 2004, MASC is part of the UC Santa Cruz Hardware Systems Collective, investigating how to design, 
                  build, architect, secure, optimize, integrate, and program the next generation of hardware.
                </Paragraph>
                <a 
                  href="https://masc.soe.ucsc.edu/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mission-cta"
                >
                  Visit MASC Website
                </a>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="mission-visual">
                <div className="visual-element"></div>
              </div>
            </Col>
          </Row>
        </div>

        <div className="team-section">
          <Title level={2} className="section-title">Our Team</Title>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={12}>
              <Card className="team-card glass-effect">
                <div className="team-member">
                  <div className="member-info">
                    <Title level={3}>Project Owner</Title>
                    <Text strong className="member-name">Jose Renau</Text>
                    <Text type="secondary" className="member-role">UC Santa Cruz</Text>
                    <Space className="member-links">
                      <a href="https://users.soe.ucsc.edu/~renau/" target="_blank" rel="noopener noreferrer" className="social-link">
                        <GlobalOutlined />
                      </a>
                    </Space>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card className="team-card glass-effect">
                <div className="team-member">
                  <div className="member-info">
                    <Title level={3}>Tech Lead</Title>
                    <Text strong className="member-name">Devanathan NG</Text>
                    <Text type="secondary" className="member-role">UC Santa Cruz</Text>
                    <Space className="member-links">
                      <a href="https://www.linkedin.com/in/devanathan-ng/" target="_blank" rel="noopener noreferrer" className="social-link">
                        <LinkedinOutlined />
                      </a>
                    </Space>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        <div className="support-section glass-effect">
          <div className="support-content">
            <Title level={2}>Support & Feedback</Title>
            <Paragraph className="support-text">
              We value your feedback and are committed to improving CSRankingsArena. 
              Your input helps us create a better platform for the research community.
            </Paragraph>
            <a 
              href="https://github.com/masc-ucsc/CSRankingsArena/issues" 
              target="_blank" 
              rel="noopener noreferrer"
              className="github-link"
            >
              <GithubOutlined /> Raise an Issue
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About; 