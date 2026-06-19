/* payment.js — PG / 실시간계좌이체 / 간편결제 프로바이더 */

const PG_PROVIDERS = [
  { value: 'TOSS',       label: '토스페이먼츠',
    fields: [
      { key: 'clientKey', label: 'Client Key', placeholder: 'test_ck_...' },
      { key: 'secretKey', label: 'Secret Key', placeholder: 'test_sk_...', secret: true }
    ]
  },
  { value: 'INICIS',     label: 'KG이니시스',
    fields: [
      { key: 'mid',         label: '상점 ID (MID)' },
      { key: 'signKey',     label: 'Sign Key', secret: true },
      { key: 'merchantKey', label: 'Merchant Key', secret: true }
    ]
  },
  { value: 'NICEPAY',    label: '나이스페이',
    fields: [
      { key: 'mid',         label: 'MID' },
      { key: 'merchantKey', label: 'Merchant Key', secret: true }
    ]
  },
  { value: 'KCP',        label: 'NHN KCP',
    fields: [
      { key: 'siteCode', label: 'Site Code' },
      { key: 'siteKey',  label: 'Site Key', secret: true }
    ]
  },
  { value: 'KICC',       label: 'KICC',
    fields: [
      { key: 'mallId',  label: 'Mall ID' },
      { key: 'authKey', label: 'Auth Key', secret: true }
    ]
  },
  { value: 'SETTLEBANK', label: '세틀뱅크',
    fields: [
      { key: 'mid',        label: 'MID' },
      { key: 'licenseKey', label: 'License Key', secret: true }
    ]
  }
];

// PG providers for real-time account transfer (실시간 계좌이체) — used in self-PG mode.
const ACCOUNT_TRANSFER_PROVIDERS = [
  { value: 'INICIS',  label: 'KG이니시스',
    fields: [
      { key: 'mid',        label: 'INICIS_MID' },
      { key: 'signKey',    label: 'INICIS_SIGN_KEY', secret: true },
      { key: 'iniliteKey', label: 'INICIS_INILITE_KEY', secret: true },
      { key: 'aesKey',     label: 'INICIS_AES_KEY', secret: true },
      { key: 'aesIv',      label: 'INICIS_AES_IV', secret: true },
      { key: 'apiKey',     label: 'INICIS_API_KEY', secret: true }
    ]
  },
  { value: 'TOSS',    label: '토스페이먼츠',
    fields: [
      { key: 'clientKey',  label: 'TOSS_CLIENT_KEY' },
      { key: 'secretKey',  label: 'TOSS_SECRET_KEY', secret: true },
      { key: 'apiVersion', label: 'TOSS_API_VERSION', placeholder: 'v1' }
    ]
  },
  { value: 'NICEPAY', label: '나이스페이',
    fields: [
      { key: 'clientId',  label: 'NICEPAY_CLIENT_ID' },
      { key: 'secretKey', label: 'NICEPAY_SECRET_KEY', secret: true }
    ]
  }
];

// Simple-pay providers (간편결제) — each has provider-specific credential fields.
const SIMPLE_PAY_PROVIDERS = [
  { value: 'KAKAOPAY',   label: '카카오페이',
    fields: [
      { key: 'cid',       label: 'CID (가맹점 코드)' },
      { key: 'secretKey', label: 'Secret Key', secret: true }
    ]
  },
  { value: 'NAVERPAY',   label: '네이버페이',
    fields: [
      { key: 'clientId',     label: 'Client ID' },
      { key: 'clientSecret', label: 'Client Secret', secret: true },
      { key: 'chainId',      label: 'Chain ID' }
    ]
  },
  { value: 'PAYCO',      label: '페이코',
    fields: [
      { key: 'clientId',  label: 'Client ID' },
      { key: 'secretKey', label: 'Secret Key', secret: true }
    ]
  },
  { value: 'TOSSPAY',    label: '토스페이',
    fields: [
      { key: 'clientKey', label: 'Client Key' },
      { key: 'secretKey', label: 'Secret Key', secret: true }
    ]
  },
  { value: 'APPLEPAY',   label: '애플페이',
    fields: [
      { key: 'merchantId', label: 'Merchant ID' }
    ]
  },
  { value: 'SAMSUNGPAY', label: '삼성페이',
    fields: [
      { key: 'serviceId', label: 'Service ID' }
    ]
  }
];
