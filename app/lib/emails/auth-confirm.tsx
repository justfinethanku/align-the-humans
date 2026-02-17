/**
 * Email Confirmation Template
 *
 * Sent by Supabase Auth for email verification.
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

interface AuthConfirmEmailProps {
  confirmUrl: string;
  appUrl: string;
}

export function AuthConfirmEmail({
  confirmUrl = '#',
  appUrl = 'https://alignthehumans.com',
}: AuthConfirmEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={baseStyles.body}>
        <Container style={baseStyles.container}>
          <Text style={baseStyles.heading}>
            Confirm your email
          </Text>
          <Text style={baseStyles.text}>
            Click the button below to confirm your email address and start
            using Human Alignment.
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={baseStyles.button} href={confirmUrl}>
              Confirm Email
            </Button>
          </Section>
          <Text style={{ ...baseStyles.text, fontSize: '13px' }}>
            Or copy this link:{' '}
            <Link href={confirmUrl} style={baseStyles.link}>
              {confirmUrl}
            </Link>
          </Text>
          <Hr style={baseStyles.divider} />
          <Text style={baseStyles.footer}>
            If you didn&apos;t create an account on{' '}
            <Link href={appUrl} style={baseStyles.link}>
              Human Alignment
            </Link>
            , you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default AuthConfirmEmail;
