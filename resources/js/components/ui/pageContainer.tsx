import { FC, PropsWithChildren } from 'react';

export const PageContainer: FC<PropsWithChildren> = ({ children }) => {
    return <div className={'container my-6 space-y-10 px-6 lg:my-8 lg:px-8'}>{children}</div>;
};
