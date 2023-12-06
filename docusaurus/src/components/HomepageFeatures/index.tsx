import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Enhanced Backend Security',
    Svg: require('@site/static/img/security.svg').default,
    description: (
      <>
        Implement robust access controls and ACLs to secure backend databases, ensuring restricted access to sensitive
        information.
      </>
    ),
  },
  {
    title: 'Optimized Frontend Communication',
    Svg: require('@site/static/img/communication.svg').default,
    description: (
      <>
        Improve frontend-backend communication through a dedicated client adapter, streamlining interactions with
        backend API endpoints.
      </>
    ),
  },
  {
    title: 'Simplified Authorization Logic',
    Svg: require('@site/static/img/portfolio.svg').default,
    description: (
      <>
        Enhance code organization and readability with TypeScript decorators, simplifying the definition of
        configurations and options for improved authorization logic.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
