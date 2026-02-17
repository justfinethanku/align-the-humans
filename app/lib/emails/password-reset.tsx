/**
 * Password Reset Email Template
 *
 * Sent by Supabase Auth for password reset requests.
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

interface PasswordResetEmailProps {
  resetUrl: string;
  appUrl: string;
}

export function PasswordResetEmail({
  resetUrl = '#',
  appUrl = 'https://alignthehumans.com',
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Text style={baseStyles.heading}>
            Reset your password
          </Text>
          <Text style={baseStyles.text}>
            Someone requested a password reset for your Human Alignment
            account. Click below to choose a new password.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={baseStyles.button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>
          <Text style={{ ...baseStyles.text, fontSize: '13px' }}>
            This link expires in 1 hour. If you didn&apos;t request this, you can
            safely ignore this email.
          </Text>
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

export default PasswordResetEmail;
