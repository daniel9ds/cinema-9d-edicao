import {createContext,useContext} from 'react';
import type {StyleProfile} from './styles';
export const StyleContext=createContext<StyleProfile|undefined>(undefined);
export const useStyle=()=>useContext(StyleContext);
