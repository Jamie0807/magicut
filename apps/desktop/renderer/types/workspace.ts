import type { EditorIconName } from './editor-screen';

export type WorkspaceBrand = {
    name: string;
    description: string;
};

export type WorkspaceHeaderContent = {
    title: string;
    subtitle: string;
};

export type WorkspaceNavTone = 'default' | 'active';

export type WorkspaceNavItem = {
    label: string;
    icon: EditorIconName;
    href?: string;
    tone: WorkspaceNavTone;
};

export type WorkspaceCreateCard = {
    title: string;
    href: string;
};

export type WorkspaceProject = {
    title: string;
    createdAt: string;
    coverImageUrl: string;
    href: string;
};
