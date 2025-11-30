import { UserProfile, ApplicationRecord } from '../types';

const PROFILE_KEY = 'autocv_profile';
const APPS_KEY = 'autocv_applications';

export const getProfile = (): UserProfile => {
  const stored = localStorage.getItem(PROFILE_KEY);
  if (stored) return JSON.parse(stored);
  return {
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    website: '',
    github: '',
    extraInfo: ''
  };
};

export const saveProfile = (profile: UserProfile): void => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getApplications = (): ApplicationRecord[] => {
  const stored = localStorage.getItem(APPS_KEY);
  if (stored) return JSON.parse(stored);
  return [];
};

export const saveApplication = (app: ApplicationRecord): void => {
  const apps = getApplications();
  // Check if exists, update if so, else push
  const index = apps.findIndex(a => a.id === app.id);
  if (index >= 0) {
    apps[index] = app;
  } else {
    apps.unshift(app); // Newest first
  }
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
};

export const deleteApplication = (id: string): void => {
  const apps = getApplications().filter(a => a.id !== id);
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
};