import _ from 'lodash';

export function isEven(): any {
  return _.chunk(['a', 'b', 'c', 'd'], 2);
}
