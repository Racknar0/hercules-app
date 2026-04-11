import PrivateShell from './shared/layout/PrivateShell/PrivateShell';

export default function DashboardLayout({ children }) {
    return <PrivateShell>{children}</PrivateShell>;
}
