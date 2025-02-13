import {useCallback, useEffect, useRef} from 'react';

// 防抖函数类型定义
type DebouncedFunction<T extends (...args: any[]) => any> = (
    ...args: Parameters<T>
) => void;

export function useDebounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number = 300
): DebouncedFunction<T> {
    const timeoutRef = useRef<number>();

    // 组件卸载时清除定时器
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback(
        (...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                func(...args);
            }, delay);
        },
        [func, delay]
    );
}