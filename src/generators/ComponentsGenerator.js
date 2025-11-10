/**
 * ⚛️ React 컴포넌트 생성기
 *
 * Asset을 위한 완전한 React 생태계를 생성합니다
 * - Asset 컴포넌트 (discriminated union props)
 * - Custom Hooks (useAssetPath, useAssetInfo 등)
 * - Utility 함수들
 * - 통합 index 파일
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

export class ComponentsGenerator {
  constructor(config) {
    this.config = config;
  }

  /**
   * 파일 덮어쓰기 처리
   * @param {string} filepath - 파일 경로
   * @param {string} filename - 파일명
   * @returns {boolean} - true이면 스킵, false이면 계속 진행
   */
  async handleFileOverwrite(filepath, filename) {
    try {
      await fs.access(filepath);
      // 파일이 존재함

      const overwriteMode =
        this.config.componentGeneration?.overwriteMode || 'overwrite';

      switch (overwriteMode) {
        case 'skip':
          console.log(
            chalk.yellow(`  ⚠️ ${filename} 파일이 이미 존재합니다. 건너뜁니다.`)
          );
          return true;

        case 'backup':
          const backupPath = `${filepath}.backup`;
          await fs.copyFile(filepath, backupPath);
          console.log(
            chalk.blue(`  📦 ${filename} 백업 생성: ${filename}.backup`)
          );
          return false;

        case 'overwrite':
        default:
          console.log(chalk.blue(`  🔄 ${filename} 파일을 덮어씁니다.`));
          return false;
      }
    } catch (error) {
      // 파일이 존재하지 않음 - 정상 진행
      return false;
    }
  }

  /**
   * React 컴포넌트 생성 프로세스 실행
   */
  async generate() {
    console.log(chalk.blue('⚛️ 4단계: React 컴포넌트 생성 시작...'));

    if (!this.config.componentGeneration?.enabled) {
      console.log(chalk.yellow('⚠️ 컴포넌트 생성이 비활성화되어 있습니다.'));
      return [];
    }

    const outputDir = this.config.fileGeneration.outputDir;
    const framework = this.config.componentGeneration.framework || 'react';

    // 디렉토리 생성
    await fs.mkdir(outputDir, { recursive: true });

    // 병렬 파일 생성 준비
    const tasks = [];

    // 1. Asset 컴포넌트 생성 (항상 실행)
    tasks.push(
      this.generateAssetComponent(outputDir, framework).catch((error) => ({
        error,
        file: 'Asset 컴포넌트',
      }))
    );

    // 2. Hooks 생성 (옵션)
    if (this.config.componentGeneration.generateHook) {
      tasks.push(
        this.generateHooks(outputDir).catch((error) => ({
          error,
          file: 'Hooks',
        }))
      );
    }

    // 3. Utils 생성 (옵션)
    if (this.config.componentGeneration.generateUtils) {
      tasks.push(
        import('./UtilsGenerator.js')
          .then(({ UtilsGenerator }) => {
            const utilsGenerator = new UtilsGenerator(this.config);
            return utilsGenerator.generate(outputDir);
          })
          .catch((error) => ({
            error,
            file: 'Utils',
          }))
      );
    }

    // 병렬 실행
    console.log(chalk.gray(`  🚀 ${tasks.length}개 파일 병렬 생성 중...`));
    const results = await Promise.all(tasks);

    // 결과 분석
    const generatedFiles = [];
    const errors = [];

    results.forEach((result) => {
      if (result && result.error) {
        // 에러 발생
        errors.push(result);
        console.error(
          chalk.red(`  ✗ ${result.file} 생성 실패: ${result.error.message}`)
        );
      } else if (result) {
        // 성공
        generatedFiles.push(result);
      }
    });

    // 4. Index 파일 생성 (다른 파일들이 생성된 후에)
    if (generatedFiles.length > 0) {
      try {
        const indexFile = await this.generateIndex(outputDir);
        generatedFiles.push(indexFile);
      } catch (error) {
        console.error(chalk.red(`  ✗ Index 파일 생성 실패: ${error.message}`));
        errors.push({ error, file: 'Index' });
      }
    }

    // 최종 결과 출력
    if (errors.length > 0) {
      console.log(
        chalk.yellow(
          `⚠️ 4단계 완료: ${generatedFiles.length}개 파일 생성됨 (${errors.length}개 실패)`
        )
      );
    } else {
      console.log(
        chalk.green(
          `✅ 4단계 완료: React 컴포넌트 생성됨 (${generatedFiles.length}개 파일)`
        )
      );
    }

    return generatedFiles;
  }

  /**
   * Asset 컴포넌트 생성
   */
  async generateAssetComponent(outputDir, framework) {
    const componentName =
      this.config.componentGeneration.componentName || 'Asset';
    const filename = `${componentName}.tsx`;
    const filepath = join(outputDir, filename);

    // 파일 존재 여부 확인 및 처리
    const shouldSkip = await this.handleFileOverwrite(filepath, filename);
    if (shouldSkip) {
      return filepath;
    }

    let componentCode;
    switch (framework) {
      case 'react-native':
        componentCode = this.generateReactNativeComponent(componentName);
        break;
      case 'react':
      default:
        componentCode = this.generateReactComponent(componentName);
        break;
    }

    await fs.writeFile(filepath, componentCode, 'utf8');
    console.log(chalk.green(`  ✓ Asset 컴포넌트 생성: ${filename}`));

    return filepath;
  }

  /**
   * React 컴포넌트 코드 생성
   */
  generateReactComponent(componentName) {
    const { assetNameType, assetPropsType } = this.config.typeGeneration;

    return `'use client';

/**
 * 🎨 범용 Asset 컴포넌트
 *
 * Asset CodeGen에 의해 자동 생성된 React 컴포넌트
 * 모든 Asset을 type-safe하게 사용할 수 있습니다
 */

import React, { forwardRef, useMemo } from 'react';
import { ${assetPropsType}, ${assetNameType}, AssetInfo, assetPathMap } from './types';
import { getAssetPath, getSizeStyle, getAssetColor, createCommonStyle, createErrorElement } from './utils';

/**
 * 범용 Asset 컴포넌트
 *
 * @example
 * // PNG 이미지 사용
 * <Asset type="icon" name="dance-race-belt-0-png" size="md" />
 *
 * // SVG 아이콘 사용
 * <Asset type="icon" name="dance-race-belt-0-svg" size="md" />
 *
 * // URL로 이미지 사용
 * <Asset type="url" src="/path/to/image.png" size={32} />
 *
 * // 커스텀 스타일
 * <Asset type="icon" name="dance-race-car-svg" size="lg" color="primary" className="my-icon" />
 *
 * // ref 사용
 * <Asset ref={myRef} type="icon" name="dance-race-car-png" size="lg" />
 */
export const ${componentName} = forwardRef<HTMLImageElement, ${assetPropsType}>(function ${componentName}Component(props, ref) {
    const { size, color, className, style, 'aria-label': ariaLabel, alt, fallback, ratio } = props;

    // 사이즈 스타일 계산
    const sizeStyle = useMemo(() => getSizeStyle(size, ratio, style), [size, ratio, style]);

    // 색상 계산
    const actualColor = useMemo(() => getAssetColor(color), [color]);

    // width/height 속성 추출 (레이아웃 시프트 방지)
    const dimensionProps = useMemo(() => {
        const props: { width?: number; height?: number } = {};
        if (typeof sizeStyle.width === 'number') props.width = sizeStyle.width;
        if (typeof sizeStyle.height === 'number') props.height = sizeStyle.height;
        return props;
    }, [sizeStyle]);

    if (props.type === 'icon') {
        const { name } = props;
        const assetInfo = assetPathMap[name];

        if (!assetInfo) {
            console.warn(\`Asset "\${name}" not found in assetPathMap\`);
            if (fallback) {
                return <>{fallback}</>;
            }
            return createErrorElement('not-found', sizeStyle, className, style, name);
        }

        const assetPath = getAssetPath(name);
        const finalAlt = alt || ariaLabel || name;

        // 최종 스타일
        const commonStyle = createCommonStyle(sizeStyle, actualColor, style);

        // 기존 Asset 렌더링
        return (
            <img
                ref={ref}
                src={assetPath}
                alt={finalAlt}
                aria-label={ariaLabel}
                className={\`asset asset-\${assetInfo.type} asset-\${assetInfo.category} \${assetInfo.category && \`asset-\${assetInfo.category}\`} \${className || ''}\`}
                style={commonStyle}
                {...dimensionProps}
            />
        );
    }

    if (props.type === 'url') {
        const { src } = props;
        const finalAlt = alt || ariaLabel || 'Asset image';

        // 최종 스타일
        const commonStyle = createCommonStyle(sizeStyle, actualColor, style);

        // URL 이미지 렌더링
        return (
            <img
                ref={ref}
                src={src}
                alt={finalAlt}
                aria-label={ariaLabel}
                className={\`asset asset-url \${className || ''}\`}
                style={commonStyle}
                {...dimensionProps}
            />
        );
    }

    return fallback || null;
});

${componentName}.displayName = '${componentName}';

export default ${componentName};`;
  }

  /**
   * React Native 컴포넌트 코드 생성
   */
  generateReactNativeComponent(componentName) {
    const { assetNameType, assetPropsType } = this.config.typeGeneration;

    return `/**
 * 🎨 Asset 컴포넌트 (React Native)
 *
 * Asset CodeGen에 의해 자동 생성된 React Native 컴포넌트
 * 모든 Asset을 type-safe하게 사용할 수 있습니다
 */

import React from 'react'
import { Image, ImageStyle, StyleProp } from 'react-native'
import { ${assetPropsType}, ${assetNameType}, SizeType, ColorType, assetPathMap, sizeMapping, colorMapping } from './types'

/**
 * Asset을 렌더링하는 메인 컴포넌트
 */
export default function ${componentName}(props: ${assetPropsType}) {
  // 공통 size 계산
  const calculatedSize = calculateSize(props.size)

  if (props.type === 'icon') {
    return renderIcon(props, calculatedSize)
  } else if (props.type === 'image') {
    return renderImage(props, calculatedSize)
  } else {
    return renderUrl(props, calculatedSize)
  }
}

/**
 * 아이콘 렌더링
 */
function renderIcon(props: Extract<${assetPropsType}, { type: 'icon' }>, size: number) {
  const assetInfo = assetPathMap[props.name]

  const source = { uri: assetInfo.path }

  const style: StyleProp<ImageStyle> = [
    {
      width: size,
      height: size,
      tintColor: calculateColor(props.color),
    },
    props.style,
  ]

  return <Image source={source} style={style} />
}

/**
 * 이미지 렌더링
 */
function renderImage(props: Extract<${assetPropsType}, { type: 'image' }>, size: number) {
  const assetInfo = assetPathMap[props.name]
  const source = { uri: assetInfo.path }

  const style: StyleProp<ImageStyle> = [
    {
      width: size,
      height: size,
    },
    props.style,
  ]

  return <Image source={source} style={style} />
}

/**
 * URL 기반 이미지 렌더링
 */
function renderUrl(props: Extract<${assetPropsType}, { type: 'url' }>, size: number) {
  const source = { uri: props.src }

  const style: StyleProp<ImageStyle> = [
    {
      width: size,
      height: size,
    },
    props.style,
  ]

  return <Image source={source} style={style} />
}

/**
 * Size 계산 유틸리티
 */
function calculateSize(size?: SizeType | number): number {
  if (typeof size === 'number') {
    return size
  }

  if (typeof size === 'string' && size in sizeMapping) {
    return sizeMapping[size as SizeType]
  }

  return sizeMapping.md || 24 // 기본값
}

/**
 * Color 계산 유틸리티
 */
function calculateColor(color?: ColorType | string): string | undefined {
  if (!color) return undefined

  if (typeof color === 'string' && color in colorMapping) {
    return colorMapping[color as ColorType]
  }

  return color
}`;
  }

  /**
   * Hooks 파일 생성
   */
  async generateHooks(outputDir) {
    const filename = 'hooks.ts';
    const filepath = join(outputDir, filename);

    // 파일 존재 여부 확인 및 처리
    const shouldSkip = await this.handleFileOverwrite(filepath, filename);
    if (shouldSkip) {
      return filepath;
    }

    const hooksCode = this.generateHooksCode();

    await fs.writeFile(filepath, hooksCode, 'utf8');
    console.log(chalk.green(`  ✓ Hooks 파일 생성: ${filename}`));

    return filepath;
  }

  /**
   * Hooks 코드 생성
   */
  generateHooksCode() {
    const { assetNameType } = this.config.typeGeneration;

    return `/**
 * 🪝 Asset Hooks
 *
 * Asset CodeGen에 의해 자동 생성된 React Hooks
 */

import { useMemo } from 'react'
import { ${assetNameType}, AssetInfo } from './types'
import { getAssetPath, getAssetInfo } from './utils'

/**
 * Asset 경로를 가져오는 Hook
 */
export function useAssetPath(name: ${assetNameType}): string {
  return useMemo(() => getAssetPath(name), [name])
}

/**
 * Asset 정보를 가져오는 Hook
 */
export function useAssetInfo(name: ${assetNameType}): AssetInfo | null {
  return useMemo(() => getAssetInfo(name), [name])
}`;
  }

  /**
   * Index 파일 생성
   */
  async generateIndex(outputDir) {
    const filename = 'index.ts';
    const filepath = join(outputDir, filename);

    // 파일 존재 여부 확인 및 처리
    const shouldSkip = await this.handleFileOverwrite(filepath, filename);
    if (shouldSkip) {
      return filepath;
    }

    const indexCode = this.generateIndexCode();

    await fs.writeFile(filepath, indexCode, 'utf8');
    console.log(chalk.green(`  ✓ Index 파일 생성: ${filename}`));

    return filepath;
  }

  /**
   * Index 코드 생성
   */
  generateIndexCode() {
    const componentName =
      this.config.componentGeneration.componentName || 'Asset';
    const generateHook = this.config.componentGeneration.generateHook;
    const generateUtils = this.config.componentGeneration.generateUtils;

    const exports = [];

    // 1. 컴포넌트 export
    exports.push(`// Asset 컴포넌트`);
    exports.push(
      `export { default as ${componentName} } from './${componentName}'`
    );

    // 2. 타입들 export
    exports.push(`\n// 타입 정의`);
    exports.push(`export * from './types'`);

    // 3. Hooks export (옵션)
    if (generateHook) {
      exports.push(`\n// Hooks`);
      exports.push(`export * from './hooks'`);
    }

    // 4. Utils export (옵션)
    if (generateUtils) {
      exports.push(`\n// Utilities`);
      exports.push(`export * from './utils'`);
    }

    return `/**
 * 🎨 Asset 모듈
 *
 * Asset CodeGen에 의해 자동 생성된 통합 export 파일
 */

${exports.join('\n')}
`;
  }
}
