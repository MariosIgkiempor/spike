import { FC, PropsWithChildren } from 'react';

export const PageContainer: FC<PropsWithChildren> = ({ children }) => {
    return <div className={'container my-4 space-y-12 px-4 lg:my-6 lg:px-6'}>{children}</div>;
};
