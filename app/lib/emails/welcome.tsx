/**
 * Welcome Email Template
 *
 * Sent after successful email verification / signup.
 */

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Link,
} from '@react-email/components';
import { baseStyles, colors } from './styles';

interface WelcomeEmailProps {
  userName: string;
  dashboardUrl: string;
  appUrl: string;
}

export function WelcomeEmail({
  userName = 'there',
  dashboardUrl = '#',
  appUrl = 'https://alignthehumans.com',
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Text style={baseStyles.heading}>
            Welcome to Human Alignment
          </Text>
          <Text style={baseStyles.text}>
            Hi {userName}, you&apos;re all set. Human Alignment helps you and your
            partners make decisions together — from everyday logistics to
            business foundations.
          </Text>
          <Text style={baseStyles.text}>
            <strong style={{ color: colors.text }}>Here&apos;s how it works:</strong>
          </Text>
          <Text style={baseStyles.text}>
            1. Create an alignment and invite your partner{'\n'}
            2. Each of you answers independently{'\n'}
            3. AI reveals where you align and where you differ{'\n'}
            4. Work through differences together{'\n'}
            5. Sign your agreement
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={baseStyles.button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>
          <Hr style={baseStyles.divider} />
          <Text style={baseStyles.footer}>
            <Link href={appUrl} style={baseStyles.link}>
              Human Alignment
            </Link>{' '}
            — Structure for every decision that matters.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
