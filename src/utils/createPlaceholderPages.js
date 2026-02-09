import fs from 'fs';
import path from 'path';

const pages = [
  { name: 'MainMenuPage', path: 'src/pages/MainMenuPage.tsx' },
  { name: 'DashboardPage', path: 'src/pages/DashboardPage.tsx' },
  { name: 'RegistrationPage', path: 'src/pages/RegistrationPage.tsx' },
  { name: 'ForgotPasswordPage', path: 'src/pages/ForgotPasswordPage.tsx' },
  { name: 'VerifyEmailPage', path: 'src/pages/VerifyEmailPage.tsx' },
  { name: 'DictionariesPage', path: 'src/pages/DictionariesPage.tsx' },
  { name: 'ElectronicFieldMapPage', path: 'src/pages/ElectronicFieldMapPage.tsx' },
  { name: 'MyFieldsPage', path: 'src/pages/MyFieldsPage.tsx' },
  { name: 'SubscriptionPlansPage', path: 'src/pages/SubscriptionPlansPage.tsx' },
  { name: 'ApiTestPage', path: 'src/pages/ApiTestPage.tsx' },
  // Weather pages
  { name: 'WeatherPage', path: 'src/pages/weather/WeatherPage.tsx' },
  { name: 'GisPage', path: 'src/pages/weather/GisPage.tsx' },
  { name: 'WeatherAnalyticsPage', path: 'src/pages/weather/WeatherAnalyticsPage.tsx' },
  // Company pages
  { name: 'CompanyPage', path: 'src/pages/company/CompanyPage.tsx' },
  { name: 'EmployeeManagementPage', path: 'src/pages/company/EmployeeManagementPage.tsx' },
  { name: 'CompanyTasksPage', path: 'src/pages/company/CompanyTasksPage.tsx' },
  { name: 'ChatPage', path: 'src/pages/company/ChatPage.tsx' },
  // Satellite pages
  { name: 'SatelliteDataPage', path: 'src/pages/satellite/SatelliteDataPage.tsx' },
  { name: 'SatelliteImagesPage', path: 'src/pages/satellite/SatelliteImagesPage.tsx' },
  { name: 'SatelliteImagesAdminPage', path: 'src/pages/satellite/SatelliteImagesAdminPage.tsx' },
  // Support pages
  { name: 'UserSupportTicketsPage', path: 'src/pages/support/UserSupportTicketsPage.tsx' },
  { name: 'UserChatPage', path: 'src/pages/support/UserChatPage.tsx' },
  // Admin pages
  { name: 'TaskSchedulerPage', path: 'src/pages/admin/TaskSchedulerPage.tsx' },
  { name: 'LoggingPage', path: 'src/pages/admin/LoggingPage.tsx' },
  { name: 'SystemStatusPage', path: 'src/pages/admin/SystemStatusPage.tsx' },
  { name: 'AppealsPage', path: 'src/pages/admin/AppealsPage.tsx' },
  { name: 'FileStoragePage', path: 'src/pages/admin/FileStoragePage.tsx' },
];

pages.forEach(({ name, path: filePath }) => {
  const template = `import React from 'react';

const ${name}: React.FC = () => {
  return (
    <div className="${name.replace(/Page$/, '').toLowerCase()}-page">
      <h1>${name.replace(/Page$/, '').replace(/([A-Z])/g, ' $1').trim()}</h1>
      <p>This page is under development.</p>
    </div>
  );
};

export default ${name};
`;

  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, template);
  console.log(`Created ${filePath}`);
});

console.log('All placeholder pages created successfully!');