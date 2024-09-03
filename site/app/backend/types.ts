export interface User {
  id: string;
  email: string;
  profile: {
    firstName: string;
    middlename?: string;
    lastName: string;
  };
}
