export const COURT_TYPE_LABELS: Record<string, string> = {
    badminton: 'Cầu lông',
    tennis: 'Tennis',
    football: 'Bóng đá',
    table_tennis: 'Bóng bàn',
};

export const getCourtTypeLabel = (name: string) => COURT_TYPE_LABELS[name] || name;
