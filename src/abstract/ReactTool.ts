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

// 节流函数类型定义
type ThrottledFunction<T extends any[]> = (...args: T) => void;

export function useThrottle<T extends any[]>(
    func: (...args: T) => void,
    delay: number = 300
): ThrottledFunction<T> {
    let lastExecTime = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: T) => {
        const now = Date.now();
        const timeSinceLastExec = now - lastExecTime;

        // 如果距离上次执行时间超过 delay，立即执行
        if (timeSinceLastExec >= delay) {
            func(...args);
            lastExecTime = now;
        } else {
            // 否则设置定时器，在剩余时间后执行
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func(...args);
                lastExecTime = Date.now();
            }, delay - timeSinceLastExec);
        }
    };
}