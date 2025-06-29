import { HTMLAttributes } from 'react';
import appIcon from '../../images/app-icon.png';

export default function AppLogoIcon(props: HTMLAttributes<HTMLImageElement>) {
    return (
        <img src={appIcon} {...props} />
    );
}
